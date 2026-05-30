import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import { syncClerkUserToDatabase } from '@/lib/clerk-user-sync';
import prisma from '@/lib/prisma';

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function getCurrentDatabaseUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: adminUserSelect,
  });

  if (dbUser?.role === 'ADMIN') {
    return dbUser;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return dbUser;
  }

  return syncClerkUserToDatabase(clerkUser);
}

export async function getAdminSession(_request?: NextRequest) {
  void _request;

  const clerkUser = await getCurrentDatabaseUser();

  if (clerkUser?.role === 'ADMIN') {
    return clerkUser;
  }

  return null;
}

export async function isAdminRequest(request: NextRequest) {
  return Boolean(await getAdminSession(request));
}
