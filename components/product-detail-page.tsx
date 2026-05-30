import { ArrowLeft, BadgeCheck, Clock, Star, Tag } from 'lucide-react';
import Link from 'next/link';

import { ReviewComposer } from '@/components/review-composer';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SiteShell } from '@/components/section-pages';
import type { SerializedCustomerReview } from '@/lib/site-content';
import {
  getSalePrice,
  type StorefrontProductData,
} from '@/lib/storefront-data';

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function ProductDetailPage({
  product,
  reviews,
}: {
  product: StorefrontProductData;
  reviews: SerializedCustomerReview[];
}) {
  const salePrice = getSalePrice(product);
  const originalPrice = Math.round(product.originalPrice ?? product.price);
  const savings = originalPrice - salePrice;
  const discount = product.discount ?? product.discountPercent;

  return (
    <SiteShell>
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-charcoal/60 transition-colors hover:text-charcoal"
            href="/shop"
          >
            <ArrowLeft className="size-4" />
            Back to shop
          </Link>

          <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white/82 p-3 shadow-luxury backdrop-blur-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.name}
                className="aspect-[4/5] w-full rounded-[1.55rem] object-cover object-top"
                decoding="async"
                fetchPriority="high"
                src={product.imageUrl}
              />
            </div>

            <div className="grid gap-5">
              <Card className="rounded-[2rem] border-charcoal/10 bg-white/84 p-1 shadow-luxury backdrop-blur-xl">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-bronze/25 bg-bronze/10 px-3 py-1 text-bronze" variant="outline">
                      {product.category}
                    </Badge>
                    {product.featured ? (
                      <Badge className="border-spruce/25 bg-spruce/10 px-3 py-1 text-spruce" variant="outline">
                        Featured
                      </Badge>
                    ) : null}
                    {discount > 0 ? (
                      <Badge className="bg-oxblood px-3 py-1 text-white">
                        {discount}% Off
                      </Badge>
                    ) : null}
                  </div>

                  <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-charcoal md:text-5xl">
                    {product.name}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-charcoal/68">
                    {product.description ?? 'Premium Punjabi wear with clean finishing and a comfortable fit.'}
                  </p>

                  <div className="mt-7 flex flex-wrap items-end gap-3">
                    <p className="text-3xl font-bold text-charcoal">{formatPrice(salePrice)}</p>
                    {discount > 0 ? (
                      <p className="pb-1 text-sm text-charcoal/45 line-through">
                        {formatPrice(originalPrice)}
                      </p>
                    ) : null}
                    {savings > 0 ? (
                      <p className="pb-1 text-sm font-bold text-oxblood">
                        Save {formatPrice(savings)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.2rem] border border-charcoal/10 bg-champagne/45 p-4">
                      <BadgeCheck className="mb-2 size-5 text-spruce" />
                      <p className="text-sm font-bold text-charcoal">Stock</p>
                      <p className="mt-1 text-xs text-charcoal/55">{product.stock} available</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-charcoal/10 bg-champagne/45 p-4">
                      <Tag className="mb-2 size-5 text-bronze" />
                      <p className="text-sm font-bold text-charcoal">Offer Code</p>
                      <p className="mt-1 text-xs text-charcoal/55">{product.offerCode ?? 'No code'}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-charcoal/10 bg-champagne/45 p-4">
                      <Clock className="mb-2 size-5 text-gold" />
                      <p className="text-sm font-bold text-charcoal">Deadline</p>
                      <p className="mt-1 text-xs text-charcoal/55">
                        {product.offerEndsAt ? formatDate(product.offerEndsAt) : 'No deadline'}
                      </p>
                    </div>
                  </div>

                  <Link
                    className="mt-7 inline-flex h-12 items-center rounded-full bg-charcoal px-6 text-sm font-semibold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:-translate-y-0.5 hover:bg-ink"
                    href="/shop"
                  >
                    Add from shop
                  </Link>
                </CardContent>
              </Card>

              <ReviewComposer productId={product.id} productName={product.name} />
            </div>
          </section>

          <section className="mt-12">
            <div className="mb-5">
              <Badge className="mb-3 border-spruce/20 bg-spruce/10 px-3 py-1 text-spruce" variant="outline">
                Product Reviews
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-charcoal">Customer feedback</h2>
            </div>
            {reviews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.id} className="glass-card rounded-[1.5rem] p-1">
                    <CardHeader className="px-5 pt-5">
                      <div className="flex text-gold">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} className="size-4 fill-current" />
                        ))}
                      </div>
                      <CardTitle className="text-base text-charcoal">{review.author}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <p className="text-sm leading-7 text-charcoal/70">&ldquo;{review.quote}&rdquo;</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-card rounded-[1.5rem] p-1">
                <CardContent className="p-6 text-sm text-charcoal/60">
                  No published reviews yet.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
