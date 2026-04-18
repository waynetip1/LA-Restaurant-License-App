import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { sendFormChangeAlert } from '@/lib/resend/admin-alert';

const FORM_SOURCE_URL =
  'https://finance.lacity.gov/sites/g/files/wph1721/files/2025-12/BLANK%202026%20FORM%201000A.pdf';
const FORM_NAME = 'la_county_business_license';

export type FormCurrencyStatus = 'verified' | 'flagged';

export async function checkFormCurrency(): Promise<FormCurrencyStatus> {
  // 1. Fetch the live PDF and compute its SHA-256 hash
  const response = await fetch(FORM_SOURCE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch form PDF: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  const liveHash = crypto
    .createHash('sha256')
    .update(Buffer.from(buffer))
    .digest('hex');

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // 2. Load stored record
  const { data: stored, error } = await supabase
    .from('form_versions')
    .select('*')
    .eq('form_name', FORM_NAME)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase read error: ${error.message}`);
  }

  // 3. No record at all — first run, insert real baseline
  if (!stored) {
    const { error: insertError } = await supabase.from('form_versions').insert({
      form_name: FORM_NAME,
      source_url: FORM_SOURCE_URL,
      current_hash: liveHash,
      last_fetched_at: now,
      last_changed_at: now,
      status: 'verified',
      admin_notified: false,
    });
    if (insertError) {
      throw new Error(`Failed to insert form_versions record: ${insertError.message}`);
    }
    return 'verified';
  }

  // 4. Record exists but hash is the placeholder from seed.sql — treat as first run
  if (stored.current_hash === 'PENDING_FIRST_RUN') {
    const { error: updateError } = await supabase
      .from('form_versions')
      .update({
        current_hash: liveHash,
        source_url: FORM_SOURCE_URL,
        last_fetched_at: now,
        last_changed_at: now,
        status: 'verified',
        admin_notified: false,
      })
      .eq('form_name', FORM_NAME);
    if (updateError) {
      throw new Error(`Failed to update placeholder hash: ${updateError.message}`);
    }
    return 'verified';
  }

  // 5. Hashes match — update last_fetched_at only
  if (liveHash === stored.current_hash) {
    await supabase
      .from('form_versions')
      .update({ last_fetched_at: now })
      .eq('form_name', FORM_NAME);
    return 'verified';
  }

  // 6. Hash mismatch — form has changed
  await supabase
    .from('form_versions')
    .update({
      status: 'flagged',
      last_changed_at: now,
      last_fetched_at: now,
      admin_notified: false,
    })
    .eq('form_name', FORM_NAME);

  // Send admin alert (best-effort — don't let email failure block the return)
  try {
    await sendFormChangeAlert(stored.current_hash, liveHash, FORM_SOURCE_URL);
    await supabase
      .from('form_versions')
      .update({ admin_notified: true })
      .eq('form_name', FORM_NAME);
  } catch (emailError) {
    console.error('Admin alert email failed:', emailError);
  }

  return 'flagged';
}
