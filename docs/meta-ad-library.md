# Meta Ad Library — setup & long-lived token

SHFTD's Competitive Intelligence can pull a competitor's **real running ads**
from Meta's official Ad Library API during a deep analysis. This is optional —
without a token, the rest of the analysis (live site, social profiles, tech
stack) still works.

## 1. One-time setup

1. Create a Meta developer account and app at
   <https://developers.facebook.com/> → **My Apps → Create App** →
   use case **Other** → type **Business**.
2. Confirm your identity at <https://www.facebook.com/ID> (required by Meta to
   use the Ad Library API).
3. Note your **App ID** and **App Secret**: app dashboard →
   **Settings → Basic**. (Click "Show" to reveal the secret.)

## 2. Get a short-lived token

1. Open the Graph API Explorer:
   <https://developers.facebook.com/tools/explorer/>
2. Top-right **Application** dropdown → select your app.
3. Click **Generate Access Token** and approve. Copy the token
   (this one expires in ~1–2 hours).

## 3. Exchange it for a long-lived (~60-day) token

Paste this URL into your browser, replacing the three placeholders. No code
or terminal needed — Meta returns JSON right in the browser:

```
https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
```

The response looks like:

```json
{ "access_token": "EAAG...long...", "token_type": "bearer", "expires_in": 5183944 }
```

`expires_in: 5183944` ≈ 60 days. Copy the `access_token` value — that's your
long-lived token.

> Tip: to check any token's expiry, open
> <https://developers.facebook.com/tools/debug/accesstoken/> and paste it in.

## 4. Add it to the app

Set these environment variables (in Vercel: **Settings → Environment
Variables**, then redeploy):

| Variable            | Value                                             |
| ------------------- | ------------------------------------------------- |
| `META_ACCESS_TOKEN` | the long-lived token from step 3                  |
| `META_AD_COUNTRY`   | ISO country codes, e.g. `US` or `US,GB,DE` (opt.) |

## 5. Renewing

Long-lived user tokens last ~60 days. To avoid manual renewal, create a
**System User** token (never expires) instead:

1. <https://business.facebook.com/> → **Business Settings → Users → System
   Users → Add**.
2. Assign your app, then **Generate New Token** → select the app → generate.
3. Use that value as `META_ACCESS_TOKEN`.

## Coverage caveat

For commercial ads (`ad_type=ALL`), Meta returns the richest data for ads
delivered in the **EU** (Digital Services Act transparency). US-only brands may
return few or no API results even when ads are visible on the Ad Library
website. SHFTD surfaces exactly what the API returns and stays empty (never
fabricated) when there's nothing — the live-site + social + tech-stack signals
remain the strongest real data in those cases.
