-- ════════════════════════════════════════════════════════════════
-- SHFTD — Marketing Operating System
-- Postgres / Supabase schema
--
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- It defines enums, tables, indexes, and Row Level Security policies.
-- Types here mirror src/types/index.ts.
-- ════════════════════════════════════════════════════════════════

-- Supabase ships with the auth schema. Application users live in `users`
-- and are linked to auth.users via id.

-- ── Enums ───────────────────────────────────────────────────────
create type user_role as enum ('business', 'creator', 'admin');
create type creator_role as enum ('igniter', 'amplifier', 'closer');
create type evidence_type as enum ('ad','caption','landing_page','campaign','offer','hook','cta');
create type insight_category as enum ('winning_pattern','overused_angle','white_space');
create type campaign_path as enum ('proven','original');
create type risk_level as enum ('low','medium','high');
create type campaign_status as enum ('draft','published','live','review','completed','archived');
create type application_status as enum ('applied','invited','accepted','rejected');
create type submission_status as enum ('submitted','approved','rejected','revision_requested');
create type copy_type as enum ('hook','headline','caption','cta','script','landing_page','ad');
create type ledger_type as enum ('base_pay','performance_bonus','sales_bonus','payout');
create type ledger_status as enum ('pending','approved','paid');
create type memory_kind as enum ('winning_hook','failed_angle','best_creator_type','best_platform','best_offer','general');
create type memory_outcome as enum ('win','loss','neutral');

-- ── Core identity ───────────────────────────────────────────────
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text,
  website text,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null default 'business',
  org_id uuid references orgs(id) on delete set null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  brand_voice text,
  target_audience text,
  primary_goals text[] default '{}',
  monthly_budget numeric default 0,
  channels text[] default '{}'
);

create table creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  niches text[] default '{}',
  social_handles jsonb default '[]',
  trust_score int default 50,
  total_earnings numeric default 0,
  completed_campaigns int default 0,
  avg_engagement_rate numeric default 0,
  roles creator_role[] default '{}',
  bio text,
  avatar_url text
);

-- ── Intelligence layer ──────────────────────────────────────────
create table ci_competitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  brand_name text not null,
  domain text,
  social_handle text,
  category text,
  added_at timestamptz not null default now()
);

create table ci_evidence (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references ci_competitors(id) on delete cascade,
  type evidence_type not null,
  channel text,
  content text not null,
  source_url text,
  captured_at timestamptz not null default now()
);

create table ci_insights (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  category insight_category not null,
  title text not null,
  explanation text,
  recommendation text,
  channel text,
  confidence int default 50,
  created_at timestamptz not null default now()
);

-- many-to-many: which evidence supports which insight
create table ci_insight_evidence (
  insight_id uuid not null references ci_insights(id) on delete cascade,
  evidence_id uuid not null references ci_evidence(id) on delete cascade,
  primary key (insight_id, evidence_id)
);

-- ── Strategy engine ─────────────────────────────────────────────
create table strategy_recommendations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  insight_id uuid references ci_insights(id) on delete set null,
  path campaign_path not null,
  title text not null,
  concept text,
  rationale text,
  risk_level risk_level not null default 'medium',
  expected_upside text,
  platforms text[] default '{}',
  creator_roles creator_role[] default '{}',
  kpis text[] default '{}',
  budget_split jsonb default '[]',
  created_at timestamptz not null default now()
);

-- ── Campaigns ───────────────────────────────────────────────────
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  recommendation_id uuid references strategy_recommendations(id) on delete set null,
  name text not null,
  goal text,
  path campaign_path not null,
  status campaign_status not null default 'draft',
  narrative_angle text,
  target_audience text,
  offer text,
  deliverables text[] default '{}',
  platforms text[] default '{}',
  creator_instructions text,
  timeline_start date,
  timeline_end date,
  kpis text[] default '{}',
  budget numeric default 0,
  base_pay_pool numeric default 0,
  performance_bonus_pool numeric default 0,
  created_at timestamptz not null default now()
);

create table campaign_marketplace (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  is_open boolean not null default true,
  roles_needed creator_role[] default '{}',
  pay_min numeric default 0,
  pay_max numeric default 0,
  published_at timestamptz not null default now()
);

create table campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  creator_id uuid not null references creator_profiles(id) on delete cascade,
  role creator_role not null,
  status application_status not null default 'applied',
  pitch text,
  applied_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  creator_id uuid not null references creator_profiles(id) on delete cascade,
  content_url text,
  file_name text,
  note text,
  status submission_status not null default 'submitted',
  reviewer_note text,
  submitted_at timestamptz not null default now()
);

-- ── AI Copy Studio ──────────────────────────────────────────────
create table copy_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  type copy_type not null,
  platform text,
  tone text,
  content text not null,
  score int default 0,
  created_at timestamptz not null default now()
);

create table campaign_saved_copy (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  copy_variant_id uuid not null references copy_variants(id) on delete cascade,
  saved_at timestamptz not null default now()
);

-- Deep competitor analyses (Competitive Intelligence). The full measured
-- report is stored as JSON so the UI can re-render it without recomputing.
create table competitor_analyses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  competitor_id uuid references ci_competitors(id) on delete cascade,
  brand_name text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

-- AI-generated images (Copy Studio). The file bytes live in Supabase Storage
-- (bucket `campaign-images`); this row stores the public URL + metadata.
create table campaign_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  url text not null,
  prompt text,
  size text,
  provider text,
  created_at timestamptz not null default now()
);

-- ── Payouts & ledger ────────────────────────────────────────────
create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  creator_id uuid not null references creator_profiles(id) on delete cascade,
  type ledger_type not null,
  amount numeric not null default 0,
  status ledger_status not null default 'pending',
  note text,
  created_at timestamptz not null default now()
);

-- ── Analytics ───────────────────────────────────────────────────
create table campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  views bigint default 0,
  engagement bigint default 0,
  clicks bigint default 0,
  ctr numeric default 0,
  conversions int default 0,
  revenue numeric default 0,
  cac numeric default 0,
  roas numeric default 0,
  recorded_at timestamptz not null default now()
);

-- ── Marketing memory ────────────────────────────────────────────
create table brand_memory_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  kind memory_kind not null default 'general',
  insight text not null,
  outcome memory_outcome not null default 'neutral',
  metric_ref text,
  created_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────────
create index on users (org_id);
create index on ci_competitors (org_id);
create index on ci_evidence (competitor_id);
create index on ci_insights (org_id);
create index on strategy_recommendations (org_id);
create index on campaigns (org_id);
create index on campaigns (status);
create index on campaign_applications (campaign_id);
create index on submissions (campaign_id);
create index on copy_variants (org_id);
create index on campaign_assets (org_id);
create index on campaign_assets (campaign_id);
create index on competitor_analyses (competitor_id);
create index on ledger_entries (campaign_id);
create index on campaign_metrics (campaign_id);
create index on brand_memory_notes (org_id);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security
-- Strategy: org members can see their org's rows; creators can see
-- open marketplace listings and their own applications/submissions;
-- admins (service role) bypass RLS.
-- NOTE: these are starter policies. Harden before production.
-- ════════════════════════════════════════════════════════════════

alter table orgs enable row level security;
alter table users enable row level security;
alter table business_profiles enable row level security;
alter table creator_profiles enable row level security;
alter table ci_competitors enable row level security;
alter table ci_evidence enable row level security;
alter table ci_insights enable row level security;
alter table ci_insight_evidence enable row level security;
alter table strategy_recommendations enable row level security;
alter table campaigns enable row level security;
alter table campaign_marketplace enable row level security;
alter table campaign_applications enable row level security;
alter table submissions enable row level security;
alter table copy_variants enable row level security;
alter table campaign_saved_copy enable row level security;
alter table campaign_assets enable row level security;
alter table competitor_analyses enable row level security;
alter table ledger_entries enable row level security;
alter table campaign_metrics enable row level security;
alter table brand_memory_notes enable row level security;

-- Helper: current user's org id.
create or replace function current_org_id() returns uuid
language sql stable as $$
  select org_id from users where id = auth.uid()
$$;

-- Users can read/update their own row.
create policy "self read" on users for select using (id = auth.uid());
create policy "self update" on users for update using (id = auth.uid());

-- Org-scoped read for the common business tables.
create policy "org read orgs" on orgs for select using (id = current_org_id());
create policy "org rw competitors" on ci_competitors for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw insights" on ci_insights for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw recs" on strategy_recommendations for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw campaigns" on campaigns for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw copy" on copy_variants for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw assets" on campaign_assets for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw analyses" on competitor_analyses for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw memory" on brand_memory_notes for all using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy "org rw biz profile" on business_profiles for all using (org_id = current_org_id()) with check (org_id = current_org_id());

-- Creators can read open marketplace listings; everyone in an org can read their campaigns' listings.
create policy "marketplace read" on campaign_marketplace for select using (true);

-- TODO: tighten creator-facing policies (applications/submissions/ledger)
-- once creator<->campaign relationships are finalized. For MVP we keep
-- them permissive behind auth and rely on the service role for admin ops.
create policy "auth read applications" on campaign_applications for select using (auth.uid() is not null);
create policy "auth write applications" on campaign_applications for insert with check (auth.uid() is not null);
create policy "auth read submissions" on submissions for select using (auth.uid() is not null);
create policy "auth write submissions" on submissions for insert with check (auth.uid() is not null);
create policy "auth read creators" on creator_profiles for select using (auth.uid() is not null);
create policy "auth read metrics" on campaign_metrics for select using (auth.uid() is not null);
create policy "auth read ledger" on ledger_entries for select using (auth.uid() is not null);

-- ════════════════════════════════════════════════════════════════
-- Storage
-- Copy Studio images are uploaded to a public bucket named
-- `campaign-images`. The app auto-creates it via the service role on
-- first save, but you can also create it manually in the Supabase
-- dashboard (Storage → New bucket → name `campaign-images`, Public).
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('campaign-images', 'campaign-images', true)
on conflict (id) do nothing;
