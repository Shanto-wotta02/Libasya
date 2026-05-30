'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Search, Star } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { StorefrontProductData } from '@/lib/storefront-data';
import { cn } from '@/lib/utils';

const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Biggest Discount'];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(price);
}

function getSalePrice(product: Pick<StorefrontProductData, 'price' | 'discountPercent'>) {
  const currentPrice = Number((product as Partial<StorefrontProductData>).currentPrice ?? 0);

  if (currentPrice > 0) {
    return Math.round(currentPrice);
  }

  if (product.discountPercent <= 0) {
    return product.price;
  }

  return Math.round(product.price * ((100 - product.discountPercent) / 100));
}

function getCountdown(offerEndsAt: string | null) {
  const targetTime = offerEndsAt ? new Date(offerEndsAt).getTime() : Date.now();
  const diff = Math.max(0, targetTime - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    expired: diff <= 0,
    parts: [
      [String(hours).padStart(2, '0'), 'Hours'],
      [String(minutes).padStart(2, '0'), 'Minutes'],
      [String(seconds).padStart(2, '0'), 'Seconds'],
    ] as Array<[string, string]>,
  };
}

const initialCountdown = {
  expired: false,
  parts: [
    ['--', 'Hours'],
    ['--', 'Minutes'],
    ['--', 'Seconds'],
  ] as Array<[string, string]>,
};

function useOfferCountdown(offerEndsAt: string | null) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (!offerEndsAt) {
      return;
    }

    const updateCountdown = () => {
      setCountdown(getCountdown(offerEndsAt));
    };

    const initialTimer = window.setTimeout(updateCountdown, 0);
    const timer = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [offerEndsAt]);

  return countdown;
}

export function ProductListingBrowser({
  emptyText,
  products,
}: {
  emptyText: string;
  products: StorefrontProductData[];
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Featured');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const nextProducts = products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesSearch = normalizedQuery
        ? `${product.name} ${product.description ?? ''} ${product.category}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;

      return matchesCategory && matchesSearch;
    });

    return [...nextProducts].sort((left, right) => {
      if (sortBy === 'Price: Low to High') {
        return getSalePrice(left) - getSalePrice(right);
      }

      if (sortBy === 'Price: High to Low') {
        return getSalePrice(right) - getSalePrice(left);
      }

      if (sortBy === 'Biggest Discount') {
        return right.discountPercent - left.discountPercent;
      }

      return Number(right.featured) - Number(left.featured);
    });
  }, [activeCategory, products, query, sortBy]);

  return (
    <div className="space-y-7">
      <div className="rounded-[1.35rem] border border-charcoal/10 bg-white/76 p-3 shadow-luxury backdrop-blur-xl">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex min-h-12 items-center rounded-full border border-charcoal/10 bg-white px-4 shadow-sm">
            <Search className="size-4 shrink-0 text-charcoal/45" />
            <span className="sr-only">Search products</span>
            <Input
              className="h-11 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
              placeholder="Search by name, style, category..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="relative">
            <span className="sr-only">Sort products</span>
            <select
              aria-label="Sort products"
              className="h-12 w-full min-w-56 appearance-none rounded-full border border-charcoal/10 bg-white py-0 pl-4 pr-11 text-sm font-semibold outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-charcoal/55" />
          </label>
        </div>

        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto rounded-full bg-champagne/42 p-2">
          {categories.map((category) => (
            <button
              key={category}
              aria-pressed={activeCategory === category}
              className={cn(
                'min-w-fit rounded-full px-5 py-2.5 text-sm font-bold transition-all',
                activeCategory === category
                  ? 'bg-charcoal text-ivory shadow-lg shadow-charcoal/15'
                  : 'text-charcoal/64 hover:bg-white hover:text-charcoal',
              )}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <p className="mt-3 px-2 text-sm font-medium text-charcoal/62" aria-live="polite">
          Showing <span className="text-charcoal">{filteredProducts.length}</span> of{' '}
          <span className="text-charcoal">{products.length}</span> products
          {query ? ` for "${query}"` : ''}
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-[1.35rem] border border-charcoal/10 bg-white/75 p-10 text-center text-sm text-charcoal/60 shadow-luxury backdrop-blur-xl">
          {query || activeCategory !== 'All'
            ? 'No products matched this search. Try a different keyword or category.'
            : emptyText}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ListingProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingProductCard({ product }: { product: StorefrontProductData }) {
  const salePrice = getSalePrice(product);
  const originalPrice = Math.round(product.originalPrice ?? product.price);
  const discount = product.discount ?? product.discountPercent;
  const savings = originalPrice - salePrice;
  const countdown = useOfferCountdown(product.offerEndsAt);
  const hasLiveOffer = Boolean(product.offerCode && product.offerEndsAt && !countdown.expired);

  return (
    <Card className="flex h-full flex-col rounded-[1.45rem] border-charcoal/10 bg-white/88 p-0 shadow-luxury backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-bronze/30 hover:shadow-2xl">
      <div className="relative overflow-hidden rounded-t-[1.45rem] bg-champagne">
        <Link aria-label={`Open ${product.name}`} href={`/products/${product.id}`} prefetch={true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={product.name}
            className="aspect-[4/5] w-full object-cover object-top transition-transform duration-700 group-hover/card:scale-[1.04]"
            decoding="async"
            loading="lazy"
            src={product.imageUrl}
          />
        </Link>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/58 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {discount > 0 ? (
            <Badge className="bg-oxblood px-3 py-1 text-white shadow-lg">{discount}% Off</Badge>
          ) : null}
          {hasLiveOffer ? (
            <Badge className="border-gold/45 bg-gold/90 px-3 py-1 text-charcoal shadow-lg" variant="outline">
              Code {product.offerCode}
            </Badge>
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
          <p className="text-2xl font-bold text-charcoal">{formatPrice(salePrice)}</p>
          {discount > 0 ? (
            <p className="pb-1 text-sm text-white/50 line-through">{formatPrice(originalPrice)}</p>
          ) : null}
        </div>
        {savings > 0 ? (
          <p className="mt-1 text-xs font-bold text-oxblood">
            You save {formatPrice(savings)}
          </p>
        ) : null}
        {hasLiveOffer ? (
          <div className="mt-4 rounded-[1rem] border border-oxblood/15 bg-oxblood/8 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-oxblood">
              <span>Offer ends in</span>
              <span>Use {product.offerCode}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {countdown.parts.map(([value, label]) => (
                <div key={label} className="rounded-lg bg-white/70 px-2 py-2">
                  <p className="text-base font-bold text-charcoal">{value}</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.12em] text-charcoal/50">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="text-xs font-semibold text-charcoal/55">{product.stock} in stock</span>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-charcoal px-4 text-sm font-semibold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:-translate-y-0.5 hover:bg-ink"
            href={`/products/${product.id}`}
            prefetch={true}
          >
            Details
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
