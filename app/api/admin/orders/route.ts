import type { OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

const statuses: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Completed',
  'Cancelled',
];

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ orders });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? '').trim();
  const status = String(body.status ?? '') as OrderStatus;

  if (!id || !statuses.includes(status)) {
    return NextResponse.json({ error: 'Valid order id and status are required.' }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ order });
}
