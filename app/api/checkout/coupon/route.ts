import { NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string; subtotal?: number };
  const code = String(body.code ?? '').trim().toUpperCase();
  const subtotal = Math.max(0, Math.round(Number(body.subtotal ?? 0)));

  if (!code) {
    return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon || !coupon.isActive || coupon.expiryDate.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Coupon is invalid or expired.' }, { status: 404 });
  }

  const discountAmount = Math.round(subtotal * (coupon.discountPercent / 100));

  return NextResponse.json({
    coupon: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount,
      totalAfterDiscount: Math.max(0, subtotal - discountAmount),
    },
  });
}
