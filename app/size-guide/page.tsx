import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function SizeGuidePage() {
  const page = await getSitePage('size-guide');

  return <InfoPage {...page} />;
}
