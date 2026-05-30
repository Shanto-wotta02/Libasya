import { ProductListingPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';
import { getStorefrontProducts } from '@/lib/storefront-data';

export default async function WeekendOffersPage() {
  const [products, page] = await Promise.all([
    getStorefrontProducts({
      OR: [
        { discountPercent: { gt: 0 } },
        { offerEndsAt: { not: null } },
      ],
    }),
    getSitePage('weekend-offers'),
  ]);

  return (
    <ProductListingPage
      description={page.description}
      emptyText="No weekend offer products are active yet."
      eyebrow={page.eyebrow}
      products={products}
      title={page.title}
    />
  );
}
