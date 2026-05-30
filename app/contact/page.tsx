import { InfoPage } from '@/components/section-pages';
import { getSitePage } from '@/lib/site-content';

export default async function ContactPage() {
  const page = await getSitePage('contact');

  return <InfoPage {...page} />;
}
