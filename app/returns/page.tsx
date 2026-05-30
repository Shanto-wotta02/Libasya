import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function ReturnsPage() {
  const page = await getSitePage('returns');

  return <InfoPage {...page} />;
}
