import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function DeliveryPage() {
  const page = await getSitePage('delivery');

  return <InfoPage {...page} />;
}
