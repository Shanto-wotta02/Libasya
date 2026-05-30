import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { syncClerkUserToDatabase } from '@/lib/clerk-user-sync';
import prisma from '@/lib/prisma';

function parseRating(value: unknown) {
  return Math.min(5, Math.max(1, Math.round(Number(value ?? 5))));
}

export async function POST(request: NextRequest) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json({ error: 'Please sign in before writing a review.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const quote = String(body.quote ?? '').trim();
    const productId = String(body.productId ?? '').trim() || null;
    const rating = parseRating(body.rating);

    if (quote.length < 12) {
      return NextResponse.json(
        { error: 'Review must be at least 12 characters.' },
        { status: 400 },
      );
    }

    if (productId) {
      const productExists = await prisma.product.count({
        where: {
          id: productId,
          isArchived: false,
        },
      });

      if (!productExists) {
        return NextResponse.json({ error: 'Product was not found.' }, { status: 404 });
      }
    }

    const dbUser = await syncClerkUserToDatabase(clerkUser);
    const review = await prisma.customerReview.create({
      data: {
        quote,
        rating,
        author: dbUser.name,
        userId: dbUser.id,
        productId,
        isPublished: true,
        featuredOnHome: false,
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    revalidatePath('/reviews');
    revalidatePath('/');
    if (productId) {
      revalidatePath(`/products/${productId}`);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review could not be submitted.' },
      { status: 400 },
    );
  }
}
