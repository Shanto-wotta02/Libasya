import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function TermsPage() {
  const page = await getSitePage('terms');

  return <InfoPage {...page} />;
}
