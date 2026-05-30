import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import { parseProductPayload } from '@/lib/commerce';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = parseProductPayload((await request.json()) as Record<string, unknown>);
    const product = await prisma.product.update({
      where: { id },
      data: payload,
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/best-sellers');
    revalidatePath('/offers');
    revalidatePath('/new-arrivals');
    revalidatePath('/weekend-offers');

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update product.' },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  await prisma.product.update({
    where: { id },
    data: {
      featured: false,
      isArchived: true,
      stock: 0,
    },
  });
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/best-sellers');
  revalidatePath('/offers');
  revalidatePath('/new-arrivals');
  revalidatePath('/weekend-offers');

  return NextResponse.json({ ok: true });
}
