import type { PaymentGateway, PaymentMethod, Prisma } from '@prisma/client';

export const manualPaymentWallets = {
  BKASH: {
    label: 'bKash',
    number: process.env.NEXT_PUBLIC_BKASH_NUMBER ?? '01700-000000',
  },
  NAGAD: {
    label: 'Nagad',
    number: process.env.NEXT_PUBLIC_NAGAD_NUMBER ?? '01800-000000',
  },
  ROCKET: {
    label: 'Rocket',
    number: process.env.NEXT_PUBLIC_ROCKET_NUMBER ?? '01900-000000',
  },
} as const;

export type ManualPaymentGateway = keyof typeof manualPaymentWallets;

export function calculateCurrentPrice(originalPrice: number, discount: number) {
  const cleanPrice = Math.max(0, Number.isFinite(originalPrice) ? originalPrice : 0);
  const cleanDiscount = Math.min(90, Math.max(0, Math.round(discount || 0)));

  return Math.round(cleanPrice * ((100 - cleanDiscount) / 100));
}

export function getProductDisplayPrice(product: {
  currentPrice?: number | null;
  discount?: number | null;
  discountPercent?: number | null;
  originalPrice?: number | null;
  price?: number | null;
}) {
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const discount = Number(product.discount ?? product.discountPercent ?? 0);
  const currentPrice =
    Number(product.currentPrice || 0) > 0
      ? Number(product.currentPrice)
      : calculateCurrentPrice(originalPrice, discount);

  return {
    currentPrice,
    discount,
    originalPrice,
  };
}

export function parseProductPayload(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim();
  const imageUrl = String(body.imageUrl ?? '').trim();
  const offerCode = String(body.offerCode ?? '').trim().toUpperCase();
  const rawOfferEndsAt = String(body.offerEndsAt ?? '').trim();
  const originalPrice = Number(body.originalPrice ?? body.price);
  const discount = Math.min(
    90,
    Math.max(0, Math.round(Number(body.discount ?? body.discountPercent ?? 0))),
  );
  const currentPrice = calculateCurrentPrice(originalPrice, discount);
  let offerEndsAt: Date | null = null;

  if (!name || !imageUrl || !Number.isFinite(originalPrice) || originalPrice <= 0) {
    throw new Error('Name, image URL, and valid original price are required.');
  }

  if (rawOfferEndsAt) {
    offerEndsAt = new Date(rawOfferEndsAt);

    if (Number.isNaN(offerEndsAt.getTime())) {
      throw new Error('Offer deadline is invalid.');
    }
  }

  return {
    name,
    description: String(body.description ?? '').trim() || null,
    originalPrice,
    currentPrice,
    discount,
    price: Math.round(originalPrice),
    discountPrice: discount > 0 ? Math.round(currentPrice) : null,
    discountPercent: discount,
    imageUrl,
    category: String(body.category ?? 'Premium').trim() || 'Premium',
    stock: Math.max(0, Math.round(Number(body.stock ?? 0))),
    featured: Boolean(body.featured),
    offerCode: offerCode || null,
    offerEndsAt,
  } satisfies Prisma.ProductUncheckedCreateInput;
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  const method = String(value ?? '').trim().toUpperCase();

  return method === 'MANUAL' ? 'MANUAL' : 'COD';
}

export function normalizePaymentGateway(value: unknown): PaymentGateway | null {
  const gateway = String(value ?? '').trim().toUpperCase();

  if (gateway === 'BKASH' || gateway === 'NAGAD' || gateway === 'ROCKET') {
    return gateway;
  }

  return null;
}
