import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Admin setup is handled by Clerk sign-in and database roles.' },
    { status: 410 },
  );
}
