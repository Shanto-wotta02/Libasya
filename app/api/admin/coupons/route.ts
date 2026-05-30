import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

function parseCouponPayload(body: Record<string, unknown>) {
  const code = String(body.code ?? '').trim().toUpperCase();
  const discountPercent = Math.min(
    90,
    Math.max(1, Math.round(Number(body.discountPercent ?? 0))),
  );
  const expiryDate = new Date(String(body.expiryDate ?? ''));

  if (!code || !Number.isFinite(discountPercent) || Number.isNaN(expiryDate.getTime())) {
    throw new Error('Coupon code, discount percent, and expiry date are required.');
  }

  return {
    code,
    discountPercent,
    expiryDate,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const payload = parseCouponPayload((await request.json()) as Record<string, unknown>);
    const coupon = await prisma.coupon.upsert({
      where: { code: payload.code },
      update: payload,
      create: payload,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save coupon.' },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? '').trim();

  if (!id) {
    return NextResponse.json({ error: 'Coupon id is required.' }, { status: 400 });
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      isActive: Boolean(body.isActive),
    },
  });

  return NextResponse.json({ coupon });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Coupon id is required.' }, { status: 400 });
  }

  await prisma.coupon.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
