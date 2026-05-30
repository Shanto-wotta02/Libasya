import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

const reviewInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
} as const;

function revalidateReviewPages(productId?: string | null) {
  revalidatePath('/');
  revalidatePath('/reviews');

  if (productId) {
    revalidatePath(`/products/${productId}`);
  }
}

function serializeReview(review: {
  id: string;
  quote: string;
  author: string;
  rating: number;
  isPublished: boolean;
  featuredOnHome: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
}) {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const reviews = await prisma.customerReview.findMany({
    orderBy: [{ createdAt: 'desc' }],
    include: reviewInclude,
  });

  return NextResponse.json({ reviews: reviews.map(serializeReview) });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Review id is required.' }, { status: 400 });
    }

    const existingReview = await prisma.customerReview.findUnique({
      where: { id },
      select: {
        productId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review was not found.' }, { status: 404 });
    }

    if (body.featuredOnHome === true) {
      const featuredCount = await prisma.customerReview.count({
        where: {
          featuredOnHome: true,
          id: {
            not: id,
          },
        },
      });

      if (featuredCount >= 3) {
        return NextResponse.json(
          { error: 'Only 3 reviews can be shown on the home page.' },
          { status: 409 },
        );
      }
    }

    const data: {
      displayOrder?: number;
      featuredOnHome?: boolean;
      isPublished?: boolean;
    } = {};

    if (body.displayOrder !== undefined) {
      data.displayOrder = Math.max(0, Math.round(Number(body.displayOrder)));
    }

    if (body.featuredOnHome !== undefined) {
      data.featuredOnHome = Boolean(body.featuredOnHome);
      if (data.featuredOnHome) {
        data.isPublished = true;
      }
    }

    if (body.isPublished !== undefined) {
      data.isPublished = Boolean(body.isPublished);
      if (!data.isPublished) {
        data.featuredOnHome = false;
      }
    }

    const review = await prisma.customerReview.update({
      where: { id },
      data,
      include: reviewInclude,
    });

    revalidateReviewPages(existingReview.productId);

    return NextResponse.json({ review: serializeReview(review) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review could not be updated.' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Review id is required.' }, { status: 400 });
  }

  const review = await prisma.customerReview.findUnique({
    where: { id },
    select: {
      productId: true,
    },
  });

  if (!review) {
    return NextResponse.json({ error: 'Review was not found.' }, { status: 404 });
  }

  await prisma.customerReview.delete({ where: { id } });
  revalidateReviewPages(review.productId);

  return NextResponse.json({ ok: true });
}
