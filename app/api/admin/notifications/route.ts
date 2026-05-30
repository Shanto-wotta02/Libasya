import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [
    recentOrders,
    recentReviews,
    pendingOrders,
    hiddenReviews,
    lowStockProducts,
    pendingInvitations,
  ] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      take: 4,
    }),
    prisma.customerReview.findMany({
      include: {
        product: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.order.count({
      where: {
        status: 'Pending',
      },
    }),
    prisma.customerReview.count({
      where: {
        isPublished: false,
      },
    }),
    prisma.product.count({
      where: {
        isArchived: false,
        stock: {
          gt: 0,
          lte: 3,
        },
      },
    }),
    prisma.invitation.count({
      where: {
        status: 'PENDING',
      },
    }),
  ]);

  const notifications = [
    ...recentOrders.map((order) => ({
      id: `order-${order.id}`,
      type: 'order' as const,
      title: `New purchase: ${order.customerName}`,
      detail: `${formatCurrency(order.totalAmount)} | ${order.status}`,
      createdAt: order.createdAt.toISOString(),
      href: '/admin/dashboard',
    })),
    ...recentReviews.map((review) => ({
      id: `review-${review.id}`,
      type: 'review' as const,
      title: `Review from ${review.author}`,
      detail: review.product?.name ?? review.user?.email ?? 'General review',
      createdAt: review.createdAt.toISOString(),
      href: '/admin/dashboard',
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 8);

  return NextResponse.json({
    notifications,
    counts: {
      pendingOrders,
      hiddenReviews,
      lowStockProducts,
      pendingInvitations,
      totalAttention:
        pendingOrders + hiddenReviews + lowStockProducts + pendingInvitations,
    },
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    currency: 'BDT',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.round(value || 0));
}
