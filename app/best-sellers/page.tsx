import { ProductListingPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';
import { getStorefrontProducts } from '@/lib/storefront-data';

export default async function BestSellersPage() {
  const [products, page] = await Promise.all([
    getStorefrontProducts({ featured: true }),
    getSitePage('best-sellers'),
  ]);

  return (
    <ProductListingPage
      description={page.description}
      emptyText="No best sellers are marked yet. Mark products as Featured from the admin dashboard."
      eyebrow={page.eyebrow}
      products={products}
      title={page.title}
    />
  );
}
