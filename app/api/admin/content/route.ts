import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import {
  editablePageOrder,
  getCustomerReviews,
  getEditablePages,
  normalizeEditableSections,
  serializeCustomerReview,
  serializeSitePage,
} from '@/lib/site-content';

const editablePageIds = new Set<string>(editablePageOrder);

function parseRequiredText(value: unknown, fieldName: string) {
  const parsed = String(value ?? '').trim();

  if (!parsed) {
    throw new Error(`${fieldName} is required.`);
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [pages, reviews] = await Promise.all([
    getEditablePages(),
    getCustomerReviews({ publishedOnly: false }),
  ]);

  return NextResponse.json({ pages, reviews });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = String(body.kind ?? '').trim();

    if (kind === 'page') {
      const page = body.page as Record<string, unknown> | undefined;
      const id = String(page?.id ?? '').trim();

      if (!editablePageIds.has(id)) {
        return NextResponse.json({ error: 'Unknown editable page.' }, { status: 400 });
      }

      const pageData = {
        title: parseRequiredText(page?.title, 'Page title'),
        eyebrow: parseRequiredText(page?.eyebrow, 'Page eyebrow'),
        description: parseRequiredText(page?.description, 'Page description'),
        sections: normalizeEditableSections(page?.sections) as Prisma.InputJsonValue,
      };

      const updatedPage = await prisma.sitePage.upsert({
        where: { id },
        update: pageData,
        create: { id, ...pageData },
      });

      revalidatePath(`/${id}`);
      revalidatePath('/');

      return NextResponse.json({ page: serializeSitePage(updatedPage) });
    }

    if (kind === 'reviews') {
      const reviews = Array.isArray(body.reviews) ? body.reviews : [];
      const savedReviews = await prisma.$transaction(async (tx) => {
        const existingIds = reviews
          .map((review) => String((review as Record<string, unknown>).id ?? '').trim())
          .filter((id) => id && !id.startsWith('new-'));

        await tx.customerReview.deleteMany({
          where: existingIds.length > 0 ? { id: { notIn: existingIds } } : {},
        });

        for (const [index, review] of reviews.entries()) {
          const data = review as Record<string, unknown>;
          const id = String(data.id ?? '').trim();
          const quote = parseRequiredText(data.quote, 'Review quote');
          const author = parseRequiredText(data.author, 'Review author');
          const rating = Math.min(5, Math.max(1, Math.round(Number(data.rating ?? 5))));
          const payload = {
            quote,
            author,
            rating,
            isPublished: data.isPublished === undefined ? true : Boolean(data.isPublished),
            displayOrder: Math.round(Number(data.displayOrder ?? index)),
          };

          if (id && !id.startsWith('new-')) {
            await tx.customerReview.update({
              where: { id },
              data: payload,
            });
          } else {
            await tx.customerReview.create({ data: payload });
          }
        }

        return tx.customerReview.findMany({
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        });
      });

      revalidatePath('/');
      revalidatePath('/reviews');

      return NextResponse.json({ reviews: savedReviews.map(serializeCustomerReview) });
    }

    return NextResponse.json({ error: 'Unknown content update type.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save content.' },
      { status: 400 },
    );
  }
}
