import { notFound } from 'next/navigation';

import { ProductDetailPage } from '@/components/product-detail-page';
import { getCustomerReviews } from '@/lib/site-content';
import { getStorefrontProductById } from '@/lib/storefront-data';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, reviews] = await Promise.all([
    getStorefrontProductById(id),
    getCustomerReviews({
      productId: id,
      publishedOnly: true,
    }),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} reviews={reviews} />;
}
