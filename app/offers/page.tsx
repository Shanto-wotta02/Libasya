import { OffersPageContent } from '@/components/section-pages';
import { getStorefrontProducts } from '@/lib/storefront-data';

export default async function OffersPage() {
  const products = await getStorefrontProducts({
    OR: [
      { discountPercent: { gt: 0 } },
      { offerEndsAt: { not: null } },
    ],
  });

  return <OffersPageContent products={products} />;
}
