import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function PrivacyPage() {
  const page = await getSitePage('privacy');

  return <InfoPage {...page} />;
}
