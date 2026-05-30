import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import { parseProductPayload } from '@/lib/commerce';
import prisma from '@/lib/prisma';

function revalidateProductPages() {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/best-sellers');
  revalidatePath('/offers');
  revalidatePath('/new-arrivals');
  revalidatePath('/weekend-offers');
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isArchived: false },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const payload = parseProductPayload((await request.json()) as Record<string, unknown>);
    const product = await prisma.product.create({ data: payload });

    revalidateProductPages();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create product.' },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: parseProductPayload(body),
    });

    revalidateProductPages();

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update product.' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });
  }

  await prisma.product.update({
    where: { id },
    data: {
      featured: false,
      isArchived: true,
      stock: 0,
    },
  });
  revalidateProductPages();

  return NextResponse.json({ ok: true });
}
