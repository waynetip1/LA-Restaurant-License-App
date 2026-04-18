import { NextResponse } from 'next/server';
import { checkFormCurrency } from '@/lib/form-validator/check-form-currency';

// Vercel cron job — runs daily at 6am (configured in vercel.json)
// Schedule: "0 6 * * *"
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const status = await checkFormCurrency();

    console.log(`[form-check cron] ${timestamp} — status: ${status}`);

    return NextResponse.json({
      checked: true,
      status,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[form-check cron] ${timestamp} — error: ${message}`);

    return NextResponse.json(
      {
        checked: false,
        error: message,
        timestamp,
      },
      { status: 500 }
    );
  }
}
