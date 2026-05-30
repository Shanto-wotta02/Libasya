import 'server-only';

import { getProductDisplayPrice } from '@/lib/commerce';
import prisma from '@/lib/prisma';

export type StorefrontProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  imageUrl: string;
  category: string;
  stock: number;
  featured: boolean;
  offerCode: string | null;
  offerEndsAt: string | null;
  createdAt: string;
};

type ProductRecord = Awaited<ReturnType<typeof prisma.product.findMany>>[number];
type ProductWhereInput = NonNullable<
  NonNullable<Parameters<typeof prisma.product.findMany>[0]>['where']
>;

export function serializeProduct(product: ProductRecord): StorefrontProductData {
  const pricing = getProductDisplayPrice(product);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Math.round(pricing.originalPrice),
    discountPercent: pricing.discount,
    originalPrice: pricing.originalPrice,
    currentPrice: pricing.currentPrice,
    discount: pricing.discount,
    imageUrl: product.imageUrl,
    category: product.category,
    stock: product.stock,
    featured: product.featured,
    offerCode: product.offerCode,
    offerEndsAt: product.offerEndsAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
  };
}

export async function getStorefrontProducts(
  where?: ProductWhereInput,
) {
  const products = await prisma.product.findMany({
    where: {
      AND: [
        { isArchived: false },
        where ?? {},
      ],
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return products.map(serializeProduct);
}

export async function getStorefrontProductById(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      isArchived: false,
    },
  });

  return product ? serializeProduct(product) : null;
}

export function getSalePrice(
  product: Pick<StorefrontProductData, 'price' | 'discountPercent'> &
    Partial<Pick<StorefrontProductData, 'currentPrice'>>,
) {
  if (Number(product.currentPrice ?? 0) > 0) {
    return Math.round(Number(product.currentPrice));
  }

  if (product.discountPercent <= 0) {
    return product.price;
  }

  return Math.round(product.price * ((100 - product.discountPercent) / 100));
}
