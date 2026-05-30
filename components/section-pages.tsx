import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { ProductListingBrowser } from '@/components/product-listing-browser';
import { ReviewComposer } from '@/components/review-composer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  getSiteSettings,
  serializeSiteSettings,
} from '@/lib/site-settings';
import type {
  SerializedCustomerReview,
  SerializedSitePage,
} from '@/lib/site-content';
import {
  getSalePrice,
  type StorefrontProductData,
} from '@/lib/storefront-data';
import { cn } from '@/lib/utils';

const primaryLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Offers', href: '/offers' },
  { label: 'Reviews', href: '/reviews' },
];

const footerGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Best Sellers', href: '/best-sellers' },
      { label: 'Weekend Offers', href: '/weekend-offers' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Delivery', href: '/delivery' },
      { label: 'Returns', href: '/returns' },
    ],
  },
  {
    title: 'Libasya',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(price);
}

export async function SiteShell({ children }: { children: ReactNode }) {
  const settings = serializeSiteSettings(await getSiteSettings());
  const logoInitial = settings.brandName.trim().charAt(0).toUpperCase() || 'L';

  return (
    <div className="premium-shell luxury-grid min-h-screen text-charcoal">
      <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/78 shadow-[0_16px_50px_rgb(16_19_21/0.06)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="group flex min-w-fit items-center gap-3" href="/">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-charcoal text-sm font-bold text-gold shadow-lg shadow-charcoal/15 transition-transform group-hover:-rotate-3 group-hover:scale-105">
              {logoInitial}
            </span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-[0.22em] text-charcoal">
                {settings.brandName}
              </span>
              <span className="hidden text-[0.68rem] font-medium uppercase tracking-[0.2em] text-charcoal/45 sm:block">
                {settings.brandTagline}
              </span>
            </span>
          </Link>
          <nav className="hidden flex-1 justify-center lg:flex">
            <div className="flex items-center gap-1 rounded-full border border-charcoal/10 bg-white/55 p-1 text-sm text-charcoal/65 shadow-sm backdrop-blur-xl">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  className="whitespace-nowrap rounded-full px-4 py-2 transition-all hover:bg-charcoal hover:text-ivory"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-charcoal/65 transition-all hover:bg-white hover:text-charcoal hover:shadow-sm"
              href="/account"
            >
              Account
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:-translate-y-0.5 hover:bg-ink"
              href="/shop"
            >
              Shop
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-charcoal/10 bg-white/70 p-6 shadow-luxury backdrop-blur-xl lg:p-10">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-charcoal text-sm font-bold text-gold shadow-lg shadow-charcoal/15">
                  {logoInitial}
                </span>
                <span>
                  <span className="block text-sm font-bold uppercase tracking-[0.22em] text-charcoal">
                    {settings.brandName}
                  </span>
                  <span className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-charcoal/45">
                    {settings.brandTagline}
                  </span>
                </span>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-charcoal/65">
                {settings.footerDescription}
              </p>
              <div className="mt-4 space-y-1 text-sm font-medium text-charcoal/60">
                <p>{settings.contactPhone}</p>
                <p>{settings.contactEmail}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-bold">{group.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-charcoal/62">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link className="transition-colors hover:text-charcoal" href={link.href}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <Separator className="my-8 bg-charcoal/10" />
          <div className="flex flex-col gap-3 text-xs text-charcoal/55 sm:flex-row sm:items-center sm:justify-between">
            <p>(c) 2026 {settings.brandName}. All rights reserved.</p>
            <div className="flex gap-4">
              <Link className="hover:text-charcoal" href="/privacy">Privacy</Link>
              <Link className="hover:text-charcoal" href="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(228,189,99,0.22),transparent_28rem)]" />
      <div className="mx-auto max-w-7xl rounded-[2.3rem] bg-charcoal p-6 text-ivory shadow-2xl sm:p-8 lg:p-12">
        <Badge className="mb-5 border-gold/30 bg-gold/15 px-3 py-1 text-gold" variant="outline">
          <Sparkles className="size-3" />
          {eyebrow}
        </Badge>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-ivory/72">
          {description}
        </p>
      </div>
    </section>
  );
}

export function ProductListingPage({
  description,
  emptyText = 'No products are available in this collection yet.',
  eyebrow,
  products,
  title,
}: {
  description: string;
  emptyText?: string;
  eyebrow: string;
  products: StorefrontProductData[];
  title: string;
}) {
  return (
    <SiteShell>
      <main>
        <PageHero description={description} eyebrow={eyebrow} title={title} />
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <ProductListingBrowser emptyText={emptyText} products={products} />
        </section>
      </main>
    </SiteShell>
  );
}

export function ProductTile({ product }: { product: StorefrontProductData }) {
  const salePrice = getSalePrice(product);
  const savings = product.price - salePrice;

  return (
    <Card className="flex h-full flex-col rounded-[1.8rem] border-charcoal/10 bg-white/82 p-0 shadow-luxury backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-bronze/25 hover:shadow-2xl">
      <div className="relative overflow-hidden rounded-t-[1.8rem] bg-champagne">
        <Link aria-label={`Open ${product.name}`} href={`/products/${product.id}`} prefetch={true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={product.name}
            className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover/card:scale-[1.06]"
            decoding="async"
            loading="lazy"
            src={product.imageUrl}
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/55 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.discountPercent > 0 ? (
            <Badge className="bg-oxblood px-3 py-1 text-white shadow-lg">{product.discountPercent}% Off</Badge>
          ) : null}
          {product.featured ? (
            <Badge className="border-white/45 bg-white/86 px-3 py-1 text-charcoal shadow-sm" variant="outline">
              Featured
            </Badge>
          ) : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex text-gold">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-3.5 fill-current" />
            ))}
          </div>
          <Badge className="border-white/30 bg-white/16 text-white backdrop-blur" variant="outline">
            {product.category}
          </Badge>
        </div>
      </div>
      <CardHeader className="gap-2 px-5 pt-5">
        <CardTitle className="text-xl font-semibold leading-snug text-charcoal">
          <Link className="transition-colors hover:text-bronze" href={`/products/${product.id}`} prefetch={true}>
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 pb-5">
        <p className="min-h-12 text-sm leading-6 text-charcoal/65">
          {product.description ?? 'Premium Punjabi wear with clean finishing and a comfortable fit.'}
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <p className="text-2xl font-bold">{formatPrice(salePrice)}</p>
          {product.discountPercent > 0 ? (
            <p className="pb-1 text-sm text-charcoal/42 line-through">{formatPrice(product.price)}</p>
          ) : null}
        </div>
        {savings > 0 ? (
          <p className="mt-1 text-xs font-bold text-oxblood">
            You save {formatPrice(savings)}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xs font-semibold text-charcoal/55">{product.stock} in stock</span>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:-translate-y-0.5 hover:bg-ink"
            href={`/products/${product.id}`}
            prefetch={true}
          >
            View
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function InfoPage({
  description,
  eyebrow,
  sections,
  title,
}: {
  description: string;
  eyebrow: string;
  sections: Array<{ title: string; body: string; tone?: 'dark' | 'light' }>;
  title: string;
}) {
  return (
    <SiteShell>
      <main>
        <PageHero description={description} eyebrow={eyebrow} title={title} />
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
          {sections.map((section) => (
            <Card
              key={section.title}
              className={cn(
                'rounded-[1.8rem] border-charcoal/10 p-1 shadow-luxury backdrop-blur-xl transition-transform hover:-translate-y-1',
                section.tone === 'dark'
                  ? 'bg-charcoal text-ivory'
                  : 'bg-white/82 text-charcoal',
              )}
            >
              <CardHeader className="px-5 pt-5">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <CheckCircle2 className={cn('size-5', section.tone === 'dark' ? 'text-gold' : 'text-spruce')} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className={cn('text-sm leading-7', section.tone === 'dark' ? 'text-ivory/72' : 'text-charcoal/65')}>
                  {section.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </SiteShell>
  );
}

export function OffersPageContent({
  products,
}: {
  products: StorefrontProductData[];
}) {
  return (
    <SiteShell>
      <main>
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2.3rem] bg-charcoal p-6 text-ivory shadow-2xl sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:p-12">
            <div className="absolute -right-28 -top-28 size-80 rounded-full bg-gold/20 blur-3xl" />
            <div className="absolute -bottom-28 left-1/4 size-72 rounded-full bg-spruce/30 blur-3xl" />
            <div className="relative">
              <Badge className="mb-4 border-gold/30 bg-gold/15 px-3 py-1 text-gold" variant="outline">
                Live Offer
              </Badge>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                Product offers
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ivory/72">
                Promo codes and countdown deadlines are controlled per product from the admin dashboard.
              </p>
            </div>
            <div className="relative mt-8 rounded-[1.8rem] border border-ivory/15 bg-ivory/10 p-5 backdrop-blur-xl md:mt-0">
              <p className="text-sm font-medium text-ivory/65">Active offer products</p>
              <p className="mt-2 text-3xl font-bold text-gold">{products.length}</p>
              <p className="mt-6 text-sm leading-6 text-ivory/65">
                Add a promo code and deadline on any product to show a live countdown.
              </p>
              <Link
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-charcoal shadow-lg shadow-gold/15 transition-all hover:bg-[#f1cb74]"
                href="/shop"
              >
                Shop products
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-3 border-bronze/25 bg-bronze/10 px-3 py-1 text-bronze" variant="outline">
              Discounted Pieces
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Current sale products</h2>
          </div>
          <ProductListingBrowser
            emptyText="No discounted products are active yet."
            products={products}
          />
        </section>
      </main>
    </SiteShell>
  );
}

export function ReviewsPageContent({
  page,
  reviews,
}: {
  page: SerializedSitePage;
  reviews: SerializedCustomerReview[];
}) {
  return (
    <SiteShell>
      <main>
        <PageHero
          description={page.description}
          eyebrow={page.eyebrow}
          title={page.title}
        />
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="md:col-span-2">
            <ReviewComposer />
          </div>
          {reviews.map((review) => (
            <Card key={review.id} className="glass-card rounded-[1.8rem] p-1 transition-transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 flex text-gold">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-charcoal/72">&ldquo;{review.quote}&rdquo;</p>
                <p className="mt-5 text-sm font-bold">{review.author}</p>
                {review.productName ? (
                  <p className="mt-1 text-xs font-semibold text-charcoal/45">
                    {review.productName}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 ? (
            <Card className="glass-card rounded-[1.8rem] p-1 md:col-span-2">
              <CardContent className="p-6 text-sm text-charcoal/65">
                Reviews will appear here after they are added from the admin dashboard.
              </CardContent>
            </Card>
          ) : null}
        </section>
      </main>
    </SiteShell>
  );
}
