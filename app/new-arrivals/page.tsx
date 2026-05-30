import { ProductListingPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';
import { getStorefrontProducts } from '@/lib/storefront-data';

export default async function NewArrivalsPage() {
  const [products, page] = await Promise.all([
    getStorefrontProducts(),
    getSitePage('new-arrivals'),
  ]);

  return (
    <ProductListingPage
      description={page.description}
      eyebrow={page.eyebrow}
      products={products}
      title={page.title}
    />
  );
}
