import 'server-only';

import type { JsonValue } from '@prisma/client/runtime/client';

import prisma from '@/lib/prisma';

export type EditableSection = {
  title: string;
  body: string;
  tone?: 'dark' | 'light';
};

export type SerializedSitePage = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  sections: EditableSection[];
  updatedAt: string;
};

export type SerializedCustomerReview = {
  id: string;
  quote: string;
  author: string;
  rating: number;
  isPublished: boolean;
  featuredOnHome: boolean;
  displayOrder: number;
  productName: string | null;
  createdAt: string;
};

export const editablePageOrder = [
  'shop',
  'best-sellers',
  'new-arrivals',
  'weekend-offers',
  'about',
  'contact',
  'delivery',
  'returns',
  'size-guide',
  'privacy',
  'terms',
  'reviews',
] as const;

const pageDefaults: Record<string, Omit<SerializedSitePage, 'updatedAt'>> = {
  shop: {
    id: 'shop',
    eyebrow: 'All Products',
    title: 'Shop the Libasya collection.',
    description:
      'Browse every ready-to-ship Punjabi piece available at Libasya, including premium, festive, wedding, and everyday styles.',
    sections: [],
  },
  'best-sellers': {
    id: 'best-sellers',
    eyebrow: 'Best Sellers',
    title: 'Most added Libasya pieces.',
    description:
      'Featured Punjabi pieces selected for demand, repeat interest, and strong occasion-ready styling.',
    sections: [],
  },
  'new-arrivals': {
    id: 'new-arrivals',
    eyebrow: 'New Arrivals',
    title: 'Latest pieces now available.',
    description:
      'Freshly added Punjabi pieces and updated stock for customers who want the newest Libasya drops first.',
    sections: [],
  },
  'weekend-offers': {
    id: 'weekend-offers',
    eyebrow: 'Weekend Offers',
    title: 'Weekend offers on ready-to-wear Punjabi.',
    description:
      'Limited-time discounted Punjabi pieces with clear sale pricing and fast checkout paths.',
    sections: [],
  },
  about: {
    id: 'about',
    eyebrow: 'Libasya',
    title: 'A focused Punjabi e-commerce store.',
    description:
      'Libasya focuses on premium Punjabi pieces that are easy to browse, easy to buy, and refined enough for special occasions.',
    sections: [
      {
        title: 'What We Sell',
        body: 'Libasya is built around ready-to-wear Punjabi products for Eid, weddings, Jummah, family events, and everyday confidence.',
        tone: 'dark',
      },
      {
        title: 'Product Standard',
        body: 'Each product listing is designed around clear photos, practical descriptions, visible discount pricing, and stock confidence.',
      },
      {
        title: 'Shopping Experience',
        body: 'The store prioritizes fast browsing, mobile-friendly layouts, clean checkout paths, and straightforward account access.',
      },
      {
        title: 'Brand Direction',
        body: 'Libasya keeps the experience minimal and premium with charcoal, gold, ivory, and subtle heritage accents.',
      },
    ],
  },
  contact: {
    id: 'contact',
    eyebrow: 'Contact',
    title: 'Talk to Libasya support.',
    description:
      'Reach Libasya for product questions, size help, order support, and collaboration requests.',
    sections: [
      {
        title: 'Order Support',
        body: 'Share your name, phone number, and product details so support can quickly check the right order or product.',
        tone: 'dark',
      },
      {
        title: 'Size Help',
        body: 'Send your usual Punjabi size, height, weight, and fit preference for practical guidance before buying.',
      },
      {
        title: 'Product Questions',
        body: 'Ask about fabric feel, color, stock, discount availability, and delivery timing before placing an order.',
      },
      {
        title: 'Business',
        body: 'For collaboration or wholesale discussions, include your company name, location, and product interest.',
      },
    ],
  },
  delivery: {
    id: 'delivery',
    eyebrow: 'Support',
    title: 'Delivery built for fast shopping.',
    description:
      'Delivery information for ready-to-ship Libasya Punjabi orders across Bangladesh.',
    sections: [
      {
        title: 'Dhaka Delivery',
        body: 'Dhaka orders are prepared quickly after confirmation, with delivery timing shared before dispatch.',
        tone: 'dark',
      },
      {
        title: 'Outside Dhaka',
        body: 'Nationwide delivery is available through courier partners. Timing depends on the destination and courier availability.',
      },
      {
        title: 'Order Confirmation',
        body: 'Confirm phone number, address, size, and product before dispatch so the package reaches the right location without delay.',
      },
      {
        title: 'Delivery Fee',
        body: 'Delivery fees may vary by area. Free delivery offers are shown on active campaigns and eligible order values.',
      },
    ],
  },
  returns: {
    id: 'returns',
    eyebrow: 'Support',
    title: 'Returns and exchange policy.',
    description:
      'Clear return expectations help customers shop confidently and protect product quality.',
    sections: [
      {
        title: 'Eligibility',
        body: 'Return or exchange requests should be made quickly after delivery. The item must be unused, clean, and in original packaging.',
        tone: 'dark',
      },
      {
        title: 'Size Exchange',
        body: 'If a size is available, exchange requests can be reviewed with product condition and delivery location in mind.',
      },
      {
        title: 'Non-returnable Items',
        body: 'Used, washed, altered, damaged, or final-sale items cannot be returned because they cannot be resold as premium inventory.',
      },
      {
        title: 'How to Request',
        body: 'Contact Libasya with your order details, product name, and issue photos when needed. Support will guide the next step.',
      },
    ],
  },
  'size-guide': {
    id: 'size-guide',
    eyebrow: 'Support',
    title: 'Size guide for Libasya Punjabi pieces.',
    description: 'Use this guide to choose a Punjabi fit that feels polished without being tight.',
    sections: [
      {
        title: 'Fit Preference',
        body: 'Choose your usual Punjabi size for a regular fit. Size up if you prefer more room around the chest, shoulder, or waist.',
        tone: 'dark',
      },
      {
        title: 'Measurements',
        body: 'Measure chest, shoulder, sleeve, and length using a well-fitting Punjabi. Compare those numbers before checkout for the cleanest result.',
      },
      {
        title: 'Between Sizes',
        body: 'For formal events, choose the size that gives comfortable shoulder movement. A slightly relaxed fit usually looks better than a tight one.',
      },
      {
        title: 'Need Help',
        body: 'Send your height, weight, and usual Punjabi size through the contact page. The support team can help choose a practical fit.',
      },
    ],
  },
  privacy: {
    id: 'privacy',
    eyebrow: 'Legal',
    title: 'Privacy policy.',
    description: 'How Libasya handles account, order, and support information.',
    sections: [
      {
        title: 'Information We Use',
        body: 'Libasya may use your name, email, phone, delivery address, and order details to provide shopping and support services.',
        tone: 'dark',
      },
      {
        title: 'Account Data',
        body: 'Login and signup data is used to keep your account accessible and improve future order support.',
      },
      {
        title: 'Security',
        body: 'Account authentication is handled by Clerk. Access to admin tools is limited to approved admin users.',
      },
      {
        title: 'Support',
        body: 'Customer messages may be used to resolve delivery, product, size, or return questions.',
      },
    ],
  },
  terms: {
    id: 'terms',
    eyebrow: 'Legal',
    title: 'Terms of service.',
    description: 'Basic shopping terms for browsing, buying, and using Libasya.',
    sections: [
      {
        title: 'Product Availability',
        body: 'Products are subject to stock availability. A product can sell out before an order is fully confirmed.',
        tone: 'dark',
      },
      {
        title: 'Pricing',
        body: 'Regular price, discount percentage, and sale price are shown on the product listing when a discount is active.',
      },
      {
        title: 'Orders',
        body: 'Orders may require confirmation before dispatch. Accurate contact and delivery details are the customer responsibility.',
      },
      {
        title: 'Policy Changes',
        body: 'Libasya may update store policies, offers, delivery terms, or product details as the business changes.',
      },
    ],
  },
  reviews: {
    id: 'reviews',
    eyebrow: 'Customer Love',
    title: 'Reviews from Libasya customers.',
    description:
      'Real customer notes focused on product quality, delivery speed, fit, and shopping confidence.',
    sections: [],
  },
};

function getDefaultPage(id: string) {
  return (
    pageDefaults[id] ?? {
      id,
      eyebrow: 'Libasya',
      title: 'Page title',
      description: 'Page description',
      sections: [],
    }
  );
}

type CustomerReviewWhereInput = NonNullable<
  NonNullable<Parameters<typeof prisma.customerReview.findMany>[0]>['where']
>;

function normalizeSections(value: JsonValue): EditableSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sections: EditableSection[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }

    const data = item as Record<string, JsonValue>;
    const title = String(data.title ?? '').trim();
    const body = String(data.body ?? '').trim();
    const tone: EditableSection['tone'] = data.tone === 'dark' ? 'dark' : 'light';

    if (title && body) {
      sections.push({ title, body, tone });
    }
  }

  return sections;
}

export function normalizeEditableSections(value: unknown): EditableSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sections: EditableSection[] = [];

  for (const item of value) {
    const data = item as Record<string, unknown>;
    const title = String(data?.title ?? '').trim();
    const body = String(data?.body ?? '').trim();
    const tone: EditableSection['tone'] = data?.tone === 'dark' ? 'dark' : 'light';

    if (title && body) {
      sections.push({ title, body, tone });
    }
  }

  return sections;
}

export function serializeSitePage(page: {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  sections: JsonValue;
  updatedAt: Date;
}): SerializedSitePage {
  return {
    id: page.id,
    title: page.title,
    eyebrow: page.eyebrow,
    description: page.description,
    sections: normalizeSections(page.sections),
    updatedAt: page.updatedAt.toISOString(),
  };
}

function serializeDefaultSitePage(id: string): SerializedSitePage {
  const defaults = getDefaultPage(id);

  return {
    ...defaults,
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getSitePage(id: string) {
  const page = await prisma.sitePage.findUnique({
    where: { id },
  });

  return page ? serializeSitePage(page) : serializeDefaultSitePage(id);
}

export async function getEditablePages() {
  const pages = await Promise.all(editablePageOrder.map((pageId) => getSitePage(pageId)));

  return pages;
}

export function serializeCustomerReview(review: {
  id: string;
  quote: string;
  author: string;
  rating: number;
  isPublished: boolean;
  featuredOnHome: boolean;
  displayOrder: number;
  product?: {
    name: string;
  } | null;
  createdAt: Date;
}): SerializedCustomerReview {
  return {
    id: review.id,
    quote: review.quote,
    author: review.author,
    rating: review.rating,
    isPublished: review.isPublished,
    featuredOnHome: review.featuredOnHome,
    displayOrder: review.displayOrder,
    productName: review.product?.name ?? null,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function getCustomerReviews({
  homeOnly = false,
  productId,
  publishedOnly = true,
  take,
}: {
  homeOnly?: boolean;
  productId?: string;
  publishedOnly?: boolean;
  take?: number;
} = {}) {
  const filters: CustomerReviewWhereInput[] = [];

  if (publishedOnly) {
    filters.push({ isPublished: true });
  }

  if (homeOnly) {
    filters.push({ featuredOnHome: true });
  }

  if (productId) {
    filters.push({ productId });
  }

  const reviews = await prisma.customerReview.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
    take,
  });

  return reviews.map(serializeCustomerReview);
}

export function getHomeReviews() {
  return getCustomerReviews({
    homeOnly: true,
    publishedOnly: true,
    take: 3,
  });
}
