import { NextResponse } from 'next/server';

import { getCurrentDatabaseUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentDatabaseUser();

  return NextResponse.json({
    user,
    isAdmin: user?.role === 'ADMIN',
  });
}
