-- =============================================================================
-- RestaurantOS LA — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. profiles (extends auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_profile" ON profiles
  FOR ALL USING (id = auth.uid());


-- ---------------------------------------------------------------------------
-- 2. restaurants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  legal_name TEXT NOT NULL,
  dba TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  entity_type TEXT,           -- LLC | Corp | SoleProp | Partnership
  ein TEXT,
  alcohol_service BOOLEAN DEFAULT FALSE,
  alcohol_type TEXT,          -- beer_wine | full_liquor | none
  seating_capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_restaurants" ON restaurants
  FOR ALL USING (owner_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 3. permits
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  permit_type TEXT NOT NULL,
  agency TEXT,
  status TEXT DEFAULT 'pending',   -- pending | active | expiring | expired
  issue_date DATE,
  expiry_date DATE,
  permit_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_permits" ON permits
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 4. staff
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  full_name TEXT NOT NULL,
  role TEXT,
  food_handler_card_expiry DATE,
  servsafe_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_staff" ON staff
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 5. permit_packets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permit_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  permits_included TEXT[],
  storage_path TEXT
);

ALTER TABLE permit_packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_permit_packets" ON permit_packets
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 6. subscriptions (mirrors Stripe state)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT,                    -- free | pro | command
  status TEXT,                  -- active | past_due | canceled
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_subscriptions" ON subscriptions
  FOR ALL USING (owner_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. form_versions (CRITICAL — tracks live form currency)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  current_hash TEXT NOT NULL,       -- SHA-256 of fetched file
  last_fetched_at TIMESTAMPTZ,
  last_changed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'verified',   -- verified | pending_review | flagged
  admin_notified BOOLEAN DEFAULT FALSE
);

ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;

-- form_versions is read-only from the client; writes happen server-side only
-- via the service role key in API routes and cron jobs.
-- Authenticated users can read to check form status before generating a PDF.
CREATE POLICY "authenticated_read_form_versions" ON form_versions
  FOR SELECT USING (auth.role() = 'authenticated');


-- ---------------------------------------------------------------------------
-- 8. ai_suggestions (append-only audit log — never update or delete rows)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id),
  module TEXT,              -- accounting | marketing | vendors | analytics
  prompt TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_ai_suggestions" ON ai_suggestions
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- INSERT allowed for authenticated users; UPDATE and DELETE blocked by policy
-- (no FOR UPDATE / FOR DELETE policy = those operations are denied)
CREATE POLICY "owners_insert_ai_suggestions" ON ai_suggestions
  FOR INSERT WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 9. vendors
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendors (
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

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_vendors" ON vendors
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 10. revenue_entries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS revenue_entries (
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

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_own_revenue_entries" ON revenue_entries
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- Auto-create profile row when a new user signs up
-- (trigger on auth.users insert — keeps profiles in sync with auth)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
