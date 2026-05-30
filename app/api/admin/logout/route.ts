import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: 'Admin sessions are managed by Clerk sign-out.',
  });
}
