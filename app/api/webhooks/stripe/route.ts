import { NextResponse } from 'next/server';

// Placeholder — Stripe webhook handler built in Session 10
export async function POST() {
  return NextResponse.json({ received: true }, { status: 200 });
}
