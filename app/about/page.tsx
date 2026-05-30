import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function AboutPage() {
  const page = await getSitePage('about');

  return <InfoPage {...page} />;
}
