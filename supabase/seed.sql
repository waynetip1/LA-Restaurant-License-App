-- =============================================================================
-- RestaurantOS LA — Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================================

-- Seed the LA County Business License form version record so the hash
-- validator has a baseline to compare against on first run.
--
-- IMPORTANT: The hash value below is a placeholder ('PENDING_FIRST_RUN').
-- On first run, checkFormCurrency() detects no stored hash (or a mismatch
-- against this placeholder) and re-fetches the live PDF to establish the
-- real baseline. Replace this placeholder with the real SHA-256 hash after
-- running the validator for the first time.

INSERT INTO form_versions (
  form_name,
  source_url,
  current_hash,
  last_fetched_at,
  last_changed_at,
  status,
  admin_notified
)
VALUES (
  'la_county_business_license',
  'https://finance.lacity.gov/taxes/business-tax-registration-certificate',
  'PENDING_FIRST_RUN',
  NOW(),
  NOW(),
  'pending_review',
  FALSE
)
ON CONFLICT DO NOTHING;
