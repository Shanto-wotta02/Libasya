import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Account creation has been replaced by Clerk sign-up.' },
    { status: 410 },
  );
}
