import { NextResponse } from 'next/server';
import { checkFormCurrency } from '@/lib/form-validator/check-form-currency';
import { createServiceClient } from '@/lib/supabase/server';

const FORM_NAME = 'la_county_business_license';

// Called on-demand before every PDF generation.
// Returns 200 verified or 423 locked (flagged).
export async function GET() {
  try {
    const status = await checkFormCurrency();

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('form_versions')
      .select('last_fetched_at')
      .eq('form_name', FORM_NAME)
      .single();

    if (status === 'flagged') {
      return NextResponse.json(
        {
          status: 'flagged',
          lastChecked: data?.last_fetched_at ?? new Date().toISOString(),
          message:
            'We detected the official form may have been updated. Our team is reviewing it now. ' +
            "You'll be notified by email within 24 hours when your permit packet is ready.",
        },
        { status: 423 }
      );
    }

    return NextResponse.json({
      status: 'verified',
      lastChecked: data?.last_fetched_at ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error('form-validate error:', err);
    return NextResponse.json(
      { error: 'Form validation check failed. Please try again.' },
      { status: 500 }
    );
  }
}
