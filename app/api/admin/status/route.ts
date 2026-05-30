import { NextRequest, NextResponse } from 'next/server';

import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const adminCount = await prisma.user.count({
    where: {
      role: 'ADMIN',
      clerkId: {
        not: null,
      },
    },
  });
  const admin = await getAdminSession(request);

  return NextResponse.json({
    hasAdmin: adminCount > 0,
    admin,
  });
}
