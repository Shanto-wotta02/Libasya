import { ReviewsPageContent } from '@/components/section-pages';
import { getCustomerReviews, getSitePage } from '@/lib/site-content';

export default async function ReviewsPage() {
  const [page, reviews] = await Promise.all([
    getSitePage('reviews'),
    getCustomerReviews(),
  ]);

  return <ReviewsPageContent page={page} reviews={reviews} />;
}
