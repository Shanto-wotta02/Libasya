import { NextRequest, NextResponse } from 'next/server';

import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users, currentAdminId: admin.id });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    userId?: string;
    role?: string;
  };

  const role = body.role;

  if (!body.userId || (role !== 'ADMIN' && role !== 'USER' && role !== 'CUSTOMER')) {
    return NextResponse.json({ error: 'Invalid user role update.' }, { status: 400 });
  }

  if (body.userId === admin.id && role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'You cannot remove your own admin access.' },
      { status: 400 },
    );
  }

  const clerkAdminCount = await prisma.user.count({
    where: {
      role: 'ADMIN',
      clerkId: {
        not: null,
      },
    },
  });
  const target = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { clerkId: true, role: true },
  });

  if (target?.clerkId && target.role === 'ADMIN' && role !== 'ADMIN' && clerkAdminCount <= 1) {
    return NextResponse.json(
      { error: 'At least one admin must remain.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: body.userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
