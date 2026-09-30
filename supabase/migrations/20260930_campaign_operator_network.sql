-- ════════════════════════════════════════════════════════════════
-- SHFTD — Campaign Operator Network: PRODUCTION migration
-- Idempotent and re-runnable. Safe on the existing production database.
-- If the SQL editor complains about ALTER TYPE in a transaction, run the
-- two `alter type … add value` lines on their own first, then the rest.
-- ════════════════════════════════════════════════════════════════

-- 1) Enum values -------------------------------------------------------
alter type user_role  add value if not exists 'operator';
alter type ledger_type add value if not exists 'operator_fee';

-- 2) New tables --------------------------------------------------------
create table if not exists operator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  display_name text not null,
  business_info text,
  specialties text[] default '{}',
  portfolio_url text,
  service_fee_note text,
  conflicts_note text,
  verified_outcomes int default 0,
  repeat_brands int default 0,
  payment_reliability int,
  status text not null default 'applicant',
  review_note text,
  reviewed_by text,
  created_at timestamptz not null default now()
);
create unique index if not exists operator_profiles_user_id_uq on operator_profiles (user_id);

create table if not exists brand_operator_engagements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  operator_user_id uuid not null references users(id) on delete cascade,
  scope_note text,
  campaign_ids uuid[] default '{}',
  permissions text[] default '{}',
  service_fee numeric not null default 0,
  fee_model text not null default 'fixed',
  start_at timestamptz,
  expires_at timestamptz,
  status text not null default 'proposed',
  agreement_version int not null default 1,
  proposed_by text,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists campaign_proposals (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references brand_operator_engagements(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null,
  title text not null,
  content jsonb not null default '{}',
  version int not null default 1,
  content_hash text,
  status text not null default 'draft',
  financial_impact numeric default 0,
  rights_impact text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists proposal_approvals (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references campaign_proposals(id) on delete cascade,
  approved_version int not null,
  decision text not null,
  approved_by text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete set null,
  actor_user_id text,
  action text not null,
  subject_type text,
  subject_id text,
  data jsonb default '{}',
  created_at timestamptz not null default now()
);

create table if not exists risk_signals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete set null,
  kind text not null,
  severity text not null default 'low',
  subject_type text,
  subject_id text,
  evidence jsonb default '{}',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- 3) Ledger: operator fees share the obligations ledger ---------------
alter table ledger_entries alter column creator_id  drop not null;
alter table ledger_entries alter column campaign_id drop not null;
alter table ledger_entries add column if not exists operator_user_id uuid references users(id) on delete set null;
alter table ledger_entries add column if not exists engagement_id  uuid references brand_operator_engagements(id) on delete set null;

-- 4) Enable Row Level Security on the new tables ----------------------
alter table operator_profiles          enable row level security;
alter table brand_operator_engagements enable row level security;
alter table campaign_proposals         enable row level security;
alter table proposal_approvals         enable row level security;
alter table audit_events               enable row level security;
alter table risk_signals               enable row level security;

-- 5) Policies (drop-then-create so this is re-runnable) ---------------
-- Reads only: all writes go through the server's service-role client.
drop policy if exists "self read operator profile"  on operator_profiles;
create policy "self read operator profile"  on operator_profiles for select using (user_id = auth.uid());
drop policy if exists "self write operator profile" on operator_profiles;
create policy "self write operator profile" on operator_profiles for insert with check (user_id = auth.uid());

drop policy if exists "org read engagements" on brand_operator_engagements;
create policy "org read engagements" on brand_operator_engagements for select using (org_id = current_org_id() or operator_user_id = auth.uid());

drop policy if exists "org read proposals" on campaign_proposals;
create policy "org read proposals" on campaign_proposals for select using (org_id = current_org_id());

drop policy if exists "auth read approvals" on proposal_approvals;
create policy "auth read approvals" on proposal_approvals for select using (auth.uid() is not null);

drop policy if exists "org read audit" on audit_events;
create policy "org read audit" on audit_events for select using (org_id = current_org_id());

drop policy if exists "org read risk" on risk_signals;
create policy "org read risk" on risk_signals for select using (org_id = current_org_id());
