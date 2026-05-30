import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Password login has been replaced by Clerk sign-in.' },
    { status: 410 },
  );
}
