# RestaurantOS LA — Claude Code Project Memory

> Read this file at the start of every session before writing any code.
> This is the single source of truth for all project decisions.

---

## What This App Is

**RestaurantOS LA** is a mobile-first SaaS web app for Los Angeles restaurant owners.

**MVP:** LA County Business License only. Owner enters info once → app validates it has the current official form → generates a print-ready PDF packet → owner prints and mails or hand-delivers to the agency. No government API connections. The app fetches and hash-validates the live form PDF from the official source URL before every generation.

**Long-term vision:** Claude API (claude-sonnet-4-6) becomes the AI brain of the app — connecting to accounting, marketing, vendor management, and business analytics. Reads restaurant operational data, surfaces plain-English insights, makes suggestions, and eventually handles tasks autonomously with owner approval.

**Target user:** Los Angeles restaurant owners — new openings navigating permitting, and existing restaurants managing ongoing compliance and operations.

---

## Tech Stack — Never Deviate Without Explicit Instruction

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + Tailwind CSS — PWA enabled |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + built-in auth) |
| PDF generation | pdf-lib (JavaScript, client-side only) |
| Payments | Stripe Billing |
| Email | Resend |
| Push notifications | OneSignal |
| AI assistant | Claude API — model `claude-sonnet-4-6` |
| Compliance CMS | Notion API |
| Error monitoring | Sentry |
| Analytics | PostHog |

---

## Folder Structure — Maintain This Exactly

```
restaurantos-la/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Bottom nav, auth guard
│   │   ├── page.tsx                # Home dashboard
│   │   ├── permits/
│   │   │   ├── page.tsx            # License tracker
│   │   │   ├── wizard/page.tsx     # Permit wizard (4 steps)
│   │   │   └── [id]/page.tsx       # Individual permit detail
│   │   ├── directory/page.tsx      # LA office directory
│   │   ├── compliance/page.tsx     # Law feed
│   │   ├── staff/page.tsx          # Staff cert tracker
│   │   ├── vendors/page.tsx        # Vendor directory
│   │   └── account/page.tsx        # Subscription + profile
│   └── api/
│       ├── webhooks/stripe/route.ts
│       ├── compliance-feed/route.ts
│       ├── form-validate/route.ts   # On-demand form hash check
│       └── cron/form-check/route.ts # Daily hash check cron
├── components/
│   ├── ui/                         # Reusable primitives
│   ├── permits/                    # Permit-specific components
│   ├── dashboard/                  # Dashboard widgets
│   └── wizard/                     # Wizard step components
├── lib/
│   ├── forms/
│   │   ├── la-county-business-license.ts  # Field mappings
│   │   └── index.ts                       # Form registry
│   ├── pdf/
│   │   └── generate-packet.ts      # pdf-lib generation logic
│   ├── form-validator/
│   │   └── check-form-currency.ts  # SHA-256 fetch + compare
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── queries.ts              # Typed query helpers
│   ├── stripe/
│   │   └── client.ts
│   ├── claude/
│   │   └── assistant.ts            # Base AI function + logger
│   └── constants/
│       ├── agencies.ts             # Office directory data
│       └── jurisdictions.ts        # ZIP → jurisdiction map
├── public/
│   └── form-templates/             # Source blank PDFs
├── styles/
│   └── globals.css
├── CLAUDE.md                       # This file
├── .env.local
└── vercel.json
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only — never expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=                # $29/mo
STRIPE_COMMAND_PRICE_ID=            # $79/mo
STRIPE_PACKET_PRICE_ID=             # $149 one-time

# Resend
RESEND_API_KEY=
RESEND_ADMIN_EMAIL=                 # Where form mismatch alerts go

# OneSignal
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

# Notion
NOTION_TOKEN=
NOTION_COMPLIANCE_DB_ID=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://restaurantos.la
```

---

## Database Schema

All tables use Supabase Postgres. RLS is enabled on every table — no exceptions.

```sql
-- profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- restaurants
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  legal_name TEXT NOT NULL,
  dba TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  entity_type TEXT,         -- LLC, Corp, SoleProp, Partnership
  ein TEXT,
  alcohol_service BOOLEAN DEFAULT FALSE,
  alcohol_type TEXT,        -- beer_wine, full_liquor, none
  seating_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- permits
CREATE TABLE permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  permit_type TEXT NOT NULL,
  agency TEXT,
  status TEXT DEFAULT 'pending',  -- pending, active, expiring, expired
  issue_date DATE,
  expiry_date DATE,
  permit_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  full_name TEXT NOT NULL,
  role TEXT,
  food_handler_card_expiry DATE,
  servsafe_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- permit_packets
CREATE TABLE permit_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  permits_included TEXT[],
  storage_path TEXT
);

-- subscriptions (mirrors Stripe state)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT,                -- free, pro, command
  status TEXT,              -- active, past_due, canceled
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- form_versions (tracks live form currency — CRITICAL)
CREATE TABLE form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  current_hash TEXT NOT NULL,    -- SHA-256 of fetched file
  last_fetched_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'verified', -- verified, pending_review, flagged
  admin_notified BOOLEAN DEFAULT FALSE
);

-- ai_suggestions (audit log — every Claude API response logged here)
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  module TEXT,              -- accounting, marketing, vendors, analytics
  prompt TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  category TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- revenue_entries
CREATE TABLE revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  entry_date DATE NOT NULL,
  gross_revenue NUMERIC,
  cogs NUMERIC,
  labor_cost NUMERIC,
  net_margin NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policy Pattern — Apply to Every Table

```sql
-- Example for restaurants table (repeat pattern for all child tables)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_restaurants" ON restaurants
  FOR ALL USING (owner_id = auth.uid());

-- For child tables filtered by restaurant_id:
CREATE POLICY "owners_own_permits" ON permits
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );
```

---

## Form Currency Validation — Build This Before Anything Else

This is the most critical technical feature of the MVP. It runs in two places:

1. **On demand** — triggered every time a user initiates PDF generation
2. **Daily cron** — runs at 6am via Vercel cron as a background health check

### Logic (lib/form-validator/check-form-currency.ts)

```typescript
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/client';
import { Resend } from 'resend';

const FORM_SOURCE_URL = 'https://finance.lacity.org/sites/g/files/wph1751/files/2024-01/btrc-application.pdf';
const FORM_NAME = 'la_county_business_license';

export async function checkFormCurrency(): Promise<'verified' | 'flagged'> {
  const response = await fetch(FORM_SOURCE_URL);
  const buffer = await response.arrayBuffer();
  const hash = crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex');

  const supabase = createClient();
  const { data: stored } = await supabase
    .from('form_versions')
    .select('*')
    .eq('form_name', FORM_NAME)
    .single();

  const now = new Date().toISOString();

  if (!stored) {
    // First run — store initial hash
    await supabase.from('form_versions').insert({
      form_name: FORM_NAME,
      source_url: FORM_SOURCE_URL,
      current_hash: hash,
      last_fetched_at: now,
      last_changed_at: now,
      status: 'verified'
    });
    return 'verified';
  }

  await supabase.from('form_versions')
    .update({ last_fetched_at: now })
    .eq('form_name', FORM_NAME);

  if (hash !== stored.current_hash) {
    // Hash mismatch — form has changed
    await supabase.from('form_versions')
      .update({
        status: 'flagged',
        last_changed_at: now,
        admin_notified: false
      })
      .eq('form_name', FORM_NAME);

    // Alert admin
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'alerts@restaurantos.la',
      to: process.env.RESEND_ADMIN_EMAIL!,
      subject: 'ACTION REQUIRED: LA County Business License form has changed',
      html: `<p>The SHA-256 hash of the LA County Business License form no longer matches the stored version.</p>
             <p><strong>Source URL:</strong> ${FORM_SOURCE_URL}</p>
             <p><strong>Previous hash:</strong> ${stored.current_hash}</p>
             <p><strong>New hash:</strong> ${hash}</p>
             <p>PDF generation has been blocked for all users. Review the new form immediately and update the template.</p>`
    });

    return 'flagged';
  }

  return 'verified';
}
```

### Vercel Cron Config (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/form-check",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### User-Facing Message When Flagged

```
"We detected the official form may have been updated. Our team is 
reviewing it now. You'll be notified by email within 24 hours 
when your permit packet is ready."
```

---

## MVP Intake Wizard — 4 Steps

### Step 1 — Business basics
- Legal business name (required)
- DBA / doing business as (optional)
- Business type: Sole Proprietor | Partnership | LLC | Corporation (required)
- Business description / activity — what kind of restaurant (required)

### Step 2 — Location
- Street address (required)
- City (required)
- ZIP code (required — drives jurisdiction lookup)
- Own or lease: Own | Lease (required)

### Step 3 — Owner info
- Owner full legal name (required)
- Mailing address if different from business (optional)
- Phone number (required)
- Email address (required)
- EIN — required for LLC and Corporation
- SSN last 4 — required for Sole Proprietor only (never store full SSN)

### Step 4 — Review + generate
- Show full prefilled summary of all entered data
- Confirm accuracy checkbox before generating
- Run checkFormCurrency() — block if flagged
- Generate PDF via pdf-lib
- On success: show download button + submission instructions
- Submission instructions must include: mailing address, in-person office address, office hours, phone number for LA Office of Finance

---

## LA County Office Directory — Hardcoded Data

Store in `lib/constants/agencies.ts`. Audit phone numbers and URLs every 90 days. Add `lastAudited` date to the file header.

```typescript
// Last audited: April 2026
export const AGENCIES = [
  {
    name: 'LA City Office of Finance',
    phone: '(844) 663-4411',
    url: 'https://finance.lacity.org',
    purpose: 'Business Tax Registration Certificate'
  },
  {
    name: 'LA County Environmental Health',
    phone: '(888) 700-9995',
    url: 'https://ehservices.publichealth.lacounty.gov',
    purpose: 'Restaurant health permit'
  },
  {
    name: 'LADBS (Building & Safety)',
    phone: '(213) 482-0000',
    url: 'https://ladbs.org',
    purpose: 'Certificate of occupancy, tenant improvements'
  },
  {
    name: 'LAFD (Fire Department)',
    phone: '(213) 978-3800',
    url: 'https://lafd.org',
    purpose: 'Fire safety clearance'
  },
  {
    name: 'CA ABC',
    phone: '(213) 736-3306',
    url: 'https://abc.ca.gov',
    purpose: 'Alcohol license (Type 41, 47, 48)'
  },
  {
    name: 'CDTFA (Sales Tax)',
    phone: '(800) 400-7115',
    url: 'https://cdtfa.ca.gov',
    purpose: "Seller's permit"
  },
  {
    name: 'CA EDD',
    phone: '(888) 745-3886',
    url: 'https://edd.ca.gov',
    purpose: 'Employer payroll registration'
  },
  {
    name: 'LA County Assessor',
    phone: '(213) 974-3211',
    url: 'https://assessor.lacounty.gov',
    purpose: 'Property tax, zoning verification'
  }
];
```

---

## Brand + Design System

### CSS Variables (globals.css)

```css
:root {
  --brand: #C8391A;
  --brand-light: #FBEAE6;
  --gold: #C49A2A;
  --dark: #1C1410;
  --text: #1C1410;
  --muted: #6B6B6B;
  --surface: #FFFFFF;
  --surface2: #F5F4F1;
  --border: #D0CEC8;
  --status-ok: #2D7A2D;
  --status-ok-bg: #E8F4E8;
  --status-warn: #7A5500;
  --status-warn-bg: #FFF8E1;
  --status-err: #8B1A06;
  --status-err-bg: #FBEAE6;
}
```

### Fonts

Load from Google Fonts in layout.tsx:

```typescript
import { Playfair_Display, DM_Sans } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'] });
```

### Design Rules — Apply to Every Component

- **Mobile-first** — design for 375px width first, scale up with Tailwind sm/md/lg breakpoints
- **Bottom nav on mobile** — 5 tabs: Home, Permits, Staff, Vendors, Finance
- **Status colors** — green = active/OK, gold/amber = expiring soon, red = expired or action needed
- **Alert bar** — red left-border card (`border-l-4 border-brand`) for urgent permit actions, always at top of dashboard
- **Card pattern** — white bg, 0.5px border, rounded-xl, generous padding (p-4 or p-5)
- **CTAs** — bg-brand text-white, full width on mobile
- **Headings** — Playfair Display, body and UI — DM Sans
- **No dark mode in v1** — explicitly out of scope, do not implement

---

## Pricing + Stripe

| Tier | Price | Stripe Product |
|---|---|---|
| Starter | Free | No product — gate by absence of active subscription |
| Pro | $29/mo or $290/yr | STRIPE_PRO_PRICE_ID |
| Command | $79/mo or $790/yr | STRIPE_COMMAND_PRICE_ID |
| One-time packet | $149 | STRIPE_PACKET_PRICE_ID |

### Stripe Webhook Events to Handle

- `checkout.session.completed` — create or update subscriptions row
- `customer.subscription.updated` — sync tier and status changes
- `customer.subscription.deleted` — set status to canceled
- `invoice.payment_failed` — set status to past_due, trigger Resend email to user

### Feature Gating by Tier

| Feature | Free | Pro | Command |
|---|---|---|---|
| Permit checklist | Yes | Yes | Yes |
| Office directory | Yes | Yes | Yes |
| Form auto-fill + PDF | No | Yes | Yes |
| Renewal tracker | No | Yes | Yes |
| Compliance feed | No | Yes | Yes |
| Staff tracker | No | Yes | Yes |
| Multi-location | No | No | Yes |
| AI assistant | No | No | Yes |
| Vendor directory | No | No | Yes |
| Insurance marketplace | No | No | Yes |

---

## Claude AI Assistant

### Base Function (lib/claude/assistant.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { logAISuggestion } from '@/lib/supabase/queries';

const client = new Anthropic();

export async function askClaude(
  prompt: string,
  context: Record<string, unknown>,
  module: string,
  restaurantId: string
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are the AI business assistant for RestaurantOS LA. 
You help restaurant owners in Los Angeles understand their business 
performance and take smart action. Be concise, specific, and always 
ground your suggestions in the actual data provided. Never fabricate 
numbers. If data is missing, say so clearly. Respond in plain English 
with no jargon. Keep responses under 150 words unless a detailed 
breakdown is explicitly needed.`,
    messages: [
      {
        role: 'user',
        content: `Context data:\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${prompt}`
      }
    ]
  });

  const result = message.content[0].type === 'text' ? message.content[0].text : '';

  // Log every response for audit trail
  await logAISuggestion(restaurantId, module, prompt, result);

  return result;
}
```

### Phase 2 AI Modules — Wire Into askClaude

**Accounting module**
- Data: revenue_entries (gross_revenue, cogs, labor_cost, net_margin by date)
- Outputs: weekly P&L summary, anomaly flags, pricing suggestions

**Marketing module**
- Data: Google Business reviews, post frequency, promo dates
- Outputs: weekly action suggestions, review response drafts

**Vendor module**
- Data: vendors table, invoice history with price over time
- Outputs: price increase alerts, alternative vendor suggestions

**Analytics module**
- Data: all revenue_entries + permit status + staff count
- Outputs: performance narrative, trend identification, benchmarks

### AI Rules — Never Violate

- Every Claude API response must be logged to `ai_suggestions` table before returning to user
- AI never takes action autonomously in Phase 2 — owner must confirm every suggested action
- Phase 3 autonomous actions require explicit per-task-type opt-in from owner
- Always show the data the AI based its suggestion on, directly below the suggestion

---

## Critical Business Rules — Read Before Every Task

1. **Legal disclaimer** — required on every page that displays or generates a permit form:
   > "RestaurantOS LA assists with permit preparation but does not provide legal advice. Always verify requirements with the issuing agency before submission."

2. **Form validation blocks generation** — never generate a PDF if `form_versions.status` is `flagged` or `pending_review`. No exceptions.

3. **Service role key is server-side only** — never import `SUPABASE_SERVICE_ROLE_KEY` in any client component or expose it in any API route that runs client-side.

4. **RLS on every query** — every Supabase query filters to the authenticated user's data via RLS. Never fetch all rows from any table.

5. **Alcohol warning** — if `restaurants.alcohol_service = true`, display this warning prominently in the wizard and on the dashboard:
   > "ABC license processing takes 60–90 days. Begin this application immediately — it runs parallel to all other permits, not after them."

6. **ZIP → jurisdiction** — ZIP code determines whether the owner needs City of LA permits vs LA County unincorporated permits. The form logic branches based on this. Maintain the lookup table in `lib/constants/jurisdictions.ts`.

7. **No full SSN storage** — only store SSN last 4 digits for sole proprietors. Never log, store, or transmit full SSN anywhere in the app.

8. **Form field mappings are config files** — all PDF field mappings live in `/lib/forms/` as versioned TypeScript files. Never hardcode form field values inline in components.

9. **Agency data audit** — `lib/constants/agencies.ts` must include a `lastAudited` date in the file header comment. Update it every 90 days.

10. **ai_suggestions is append-only** — never update or delete rows in this table. It is a permanent audit log.

---

## Build Order for MVP

Follow this sequence. Do not skip ahead.

1. Project scaffolding — Next.js 14, Tailwind, folder structure, globals.css, fonts
2. Supabase — all tables, RLS policies, auth setup
3. Form currency validation — check-form-currency.ts, API route, Vercel cron, admin alert
4. Auth pages — login, signup, Supabase session handling
5. Dashboard layout — bottom nav, auth guard middleware
6. Intake wizard — 4 steps with validation and state management
7. PDF generation — pdf-lib form fill for LA County Business License
8. Dashboard home — alert bar, stat cards, permit tracker, quick actions
9. Office directory page
10. Stripe — products, webhook handler, subscription sync, paywall middleware
11. Account page — subscription status, upgrade flow
12. Compliance feed — Notion API integration
13. Staff tracker
14. Deployment — Vercel config, environment variables, cron verification

---

## Session Log

### Session 1 — Project Scaffolding (Complete)
**Date:** April 2026
**Status:** Verified

What was built and confirmed:
- Next.js 14 project initialized with App Router, TypeScript, Tailwind CSS
- All dependencies installed: @supabase/supabase-js, @supabase/ssr, pdf-lib, 
  @anthropic-ai/sdk, stripe, resend, @sentry/nextjs, posthog-js
- Full folder structure created and verified matching CLAUDE.md spec
- globals.css — all brand CSS variables confirmed present
- tailwind.config.ts — all 8 brand colors added to theme.extend.colors
- vercel.json — cron job configured at 0 6 * * * 
- .env.local — all environment variable keys present, 
  NEXT_PUBLIC_APP_URL set to https://permitready.com
- CLAUDE.md in project root

What still needs filling in before Session 2:
- .env.local Supabase keys (requires Supabase account and project creation)
- All other .env.local keys remain empty until their services are set up

---

## Session Log

### Session 2 — Supabase Database Build (Complete)
**Date:** April 2026
**Status:** Verified

What was built and confirmed:
- lib/supabase/client.ts — browser-side client using createBrowserClient from @supabase/ssr
- lib/supabase/server.ts — server-side service role client (server components + API routes only)
- lib/supabase/queries.ts — typed query helpers for all 10 tables; includes logAISuggestion
- supabase/migrations/001_initial_schema.sql — all 10 tables in spec order with RLS policies
- supabase/seed.sql — seeds form_versions with placeholder hash (validator replaces on first run)
- Auto-create profile trigger on auth.users insert included in migration

What still needs to be done before Session 3:
- Paste and run 001_initial_schema.sql in Supabase SQL Editor
- Run seed.sql in Supabase SQL Editor after migration
- Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local
- Trigger the form validator once to establish the real SHA-256 baseline hash

---

### Session 3 — Form Currency Validation (Complete)
**Date:** April 2026
**Status:** Verified — returning { status: verified } confirmed in browser

What was built and confirmed:
- lib/form-validator/check-form-currency.ts — SHA-256 fetch and compare
- lib/resend/admin-alert.ts — admin alert email on hash mismatch
- app/api/form-validate/route.ts — on-demand GET endpoint
- app/api/cron/form-check/route.ts — daily cron GET endpoint
- Real LA County Business Tax form PDF fetched and hashed successfully
- Real SHA-256 hash stored in form_versions table in Supabase
- Status confirmed as verified in live test
- Correct form URL confirmed as:
  https://finance.lacity.gov/sites/g/files/wph1721/files/2025-12/BLANK%202026%20FORM%201000A.pdf

Note for quarterly audit: Verify this URL still resolves every 90 days.
LA County updates this path when they publish new year forms.

---

## Current Build Status

- [x] Project scaffolded
- [x] Supabase schema created
- [x] Form currency validation built
- [ ] Auth working
- [ ] Dashboard layout built
- [ ] Intake wizard complete
- [ ] PDF generation working
- [ ] Dashboard home complete
- [ ] Office directory complete
- [ ] Stripe integrated
- [ ] Compliance feed live
- [ ] Staff tracker complete
- [ ] Deployed to Vercel

> Update checkboxes as each item is completed.

---

*Last updated: April 2026 — Session 3 complete and verified*
*Update this file at the end of every major build session.*
