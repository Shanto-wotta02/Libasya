import { Storefront } from '@/components/storefront';
import { getHomeReviews } from '@/lib/site-content';
import { getSiteSettings, serializeSiteSettings } from '@/lib/site-settings';
import { getStorefrontProducts } from '@/lib/storefront-data';

export default async function Home() {
  const [products, settings, homeReviews] = await Promise.all([
    getStorefrontProducts(),
    getSiteSettings(),
    getHomeReviews(),
  ]);

  return (
    <Storefront
      homeReviews={homeReviews}
      products={products}
      settings={serializeSiteSettings(settings)}
    />
  );
}
