'use client';

import { Show, SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  ChevronDown,
  Crown,
  Gem,
  Globe2,
  Heart,
  Mail,
  Menu,
  MessageSquare,
  Minus,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { isManualPaymentWalletAvailable, type ManualPaymentGateway } from '@/lib/commerce';
import { cn } from '@/lib/utils';
import { useCartStore, type CartItem } from '@/store/useCartStore';

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  originalPrice?: number;
  currentPrice?: number;
  discount?: number;
  imageUrl: string;
  category: string;
  stock: number;
  featured: boolean;
  offerCode: string | null;
  offerEndsAt: string | null;
};

export type StorefrontSettings = {
  id: string;
  brandName: string;
  brandTagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCardTitle: string;
  heroCardSubtitle: string;
  heroProductSubtitle: string;
  heroRibbonText: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  announcementText: string;
  shopEyebrow: string;
  shopTitle: string;
  shopDescription: string;
  trustOneLabel: string;
  trustOneText: string;
  trustTwoLabel: string;
  trustTwoText: string;
  trustThreeLabel: string;
  trustThreeText: string;
  offerTitle: string;
  offerSubtitle: string;
  offerCode: string;
  offerButtonLabel: string;
  offerEndsAt: string | null;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  paymentBkashNumber: string;
  paymentNagadNumber: string;
  paymentRocketNumber: string;
  updatedAt: string;
};

export type StorefrontReview = {
  id: string;
  quote: string;
  author: string;
  rating: number;
  productName: string | null;
};

type PaymentWalletMap = Record<ManualPaymentGateway, { label: string; number: string }>;

type AdminNotification = {
  id: string;
  type: 'order' | 'review';
  title: string;
  detail: string;
  createdAt: string;
  href: string;
};

type AdminNotificationResponse = {
  notifications: AdminNotification[];
  counts: {
    hiddenReviews: number;
    lowStockProducts: number;
    pendingInvitations: number;
    pendingOrders: number;
    totalAttention: number;
  };
};

const fallbackHeroImage =
  'https://images.pexels.com/photos/36412149/pexels-photo-36412149.jpeg?auto=compress&cs=tinysrgb&w=2400';

const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'Best Sellers', href: '/best-sellers' },
  { label: 'Offers', href: '/offers' },
  { label: 'Reviews', href: '/reviews' },
];

const defaultSettings: StorefrontSettings = {
  id: 'main',
  brandName: 'Libasya',
  brandTagline: 'Premium Punjabi',
  heroBadge: 'Weekend Drop Live',
  heroTitle: 'Libasya',
  heroSubtitle:
    'Premium Punjabi wear for Eid, weddings, Jummah, and everyday confidence. Shop polished ready-to-wear pieces with fast delivery.',
  heroImageUrl: fallbackHeroImage,
  heroCardTitle: 'Premium finish',
  heroCardSubtitle: 'Tailored festive look',
  heroProductSubtitle: 'Best seller - ready to ship',
  heroRibbonText: 'Eid Edit 2026',
  heroPrimaryCta: 'Shop Now',
  heroSecondaryCta: 'View Offers',
  announcementText: 'Free delivery on orders over BDT 5,000 | Weekend drop is now live',
  shopEyebrow: 'Ready to Ship',
  shopTitle: 'Shop premium Punjabi pieces made for every occasion.',
  shopDescription:
    'Clean cuts, premium fabric feel, easy checkout, and fast delivery across Bangladesh - polished enough for festive events, comfortable enough for daily wear.',
  trustOneLabel: 'Secure checkout',
  trustOneText: 'Protected payment flow',
  trustTwoLabel: 'Fast local delivery',
  trustTwoText: 'Dispatch within 24 hours',
  trustThreeLabel: 'Quality checked',
  trustThreeText: 'Inspected before packing',
  offerTitle: 'Buy two Punjabi pieces and get free delivery today.',
  offerSubtitle:
    'Use checkout code LIBASYA500 for instant savings on selected ready-to-wear Punjabi pieces.',
  offerCode: 'LIBASYA500',
  offerButtonLabel: 'Grab the Offer',
  offerEndsAt: null,
  footerDescription:
    'Premium Punjabi wear made to sell fast, ship fast, and feel refined.',
  contactEmail: 'support@libasya.com',
  contactPhone: '01700-000000',
  paymentBkashNumber: '01700-000000',
  paymentNagadNumber: '01800-000000',
  paymentRocketNumber: '01900-000000',
  updatedAt: '',
};

const categories = ['All', 'Wedding', 'Festive', 'Everyday', 'Premium'];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Biggest Discount'];
const paymentMethods = [
  {
    id: 'COD',
    label: 'Cash on Delivery',
    note: 'Pay in cash when your order arrives.',
  },
  {
    id: 'MANUAL',
    label: 'Manual Mobile Payment',
    note: 'Send to the shop wallet, then submit sender number and TxnID.',
  },
] as const;

function ClerkAuthControls({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <>
        <Show when="signed-out">
          <SignInButton mode="redirect">
            <button
              className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-charcoal/70 transition-colors hover:bg-white hover:text-charcoal"
              type="button"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect">
            <button
              className="rounded-2xl bg-charcoal px-4 py-3 text-left text-sm font-semibold text-ivory transition-colors hover:bg-ink"
              type="button"
            >
              Sign up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <div className="flex items-center rounded-2xl bg-white px-4 py-3">
            <UserButton />
            <span className="ml-3 text-sm font-semibold text-charcoal/70">Account</span>
          </div>
        </Show>
      </>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button
            className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold text-charcoal/65 transition-all hover:bg-white hover:text-charcoal hover:shadow-sm"
            type="button"
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <button
            className="inline-flex h-10 min-w-[4.75rem] items-center justify-center whitespace-nowrap rounded-full bg-charcoal px-4 text-sm font-semibold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:-translate-y-0.5 hover:bg-ink"
            type="button"
          >
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-white/80 px-2 shadow-sm">
          <UserButton />
        </div>
      </Show>
    </>
  );
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(price);

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getProductCategory(product: StorefrontProduct) {
  return product.category;
}

function getSalePrice(product: StorefrontProduct) {
  if (Number(product.currentPrice ?? 0) > 0) {
    return Math.round(Number(product.currentPrice));
  }

  const originalPrice = product.originalPrice ?? product.price;
  const discount = product.discount ?? product.discountPercent;

  if (discount <= 0) {
    return Math.round(originalPrice);
  }

  return Math.round(originalPrice * ((100 - discount) / 100));
}

function getStockLabel(product: StorefrontProduct) {
  if (product.stock <= 0) {
    return 'Sold out';
  }

  if (product.stock <= 4) {
    return `Only ${product.stock} left`;
  }

  return product.featured ? 'Trending now' : 'In stock';
}

function isProductOfferActive(product: StorefrontProduct) {
  if (!product.offerCode || !product.offerEndsAt) {
    return false;
  }

  return new Date(product.offerEndsAt).getTime() > Date.now();
}

export function Storefront({
  homeReviews = [],
  products,
  settings = defaultSettings,
}: {
  homeReviews?: StorefrontReview[];
  products: StorefrontProduct[];
  settings?: StorefrontSettings;
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Featured');
  const [cartOpen, setCartOpen] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [adminAccess, setAdminAccess] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const collection = products;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      return;
    }

    let mounted = true;

    async function loadAdminAccess() {
      try {
        const response = await fetch('/api/admin/me', {
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Admin status unavailable.');
        }

        const data = (await response.json()) as { isAdmin?: boolean };

        if (mounted) {
          setAdminAccess(Boolean(data.isAdmin));
        }
      } catch {
        if (mounted) {
          setAdminAccess(false);
        }
      }
    }

    void loadAdminAccess();

    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!lastAdded) {
      return;
    }

    const timer = window.setTimeout(() => setLastAdded(null), 1600);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = collection.filter((product) => {
      const matchesSearch = normalizedQuery
        ? `${product.name} ${product.description ?? ''} ${product.category}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesCategory =
        activeCategory === 'All' || getProductCategory(product) === activeCategory;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((left, right) => {
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
  }, [activeCategory, collection, query, sortBy]);

  const bestSellers = collection
    .filter((product) => product.featured)
    .concat(collection.filter((product) => !product.featured))
    .slice(0, 3);
  const activeOfferProduct = collection
    .filter(isProductOfferActive)
    .sort(
      (left, right) =>
        new Date(left.offerEndsAt ?? 0).getTime() -
        new Date(right.offerEndsAt ?? 0).getTime(),
    )[0];
  const paymentWallets: PaymentWalletMap = {
    BKASH: {
      label: 'bKash',
      number: settings.paymentBkashNumber,
    },
    NAGAD: {
      label: 'Nagad',
      number: settings.paymentNagadNumber,
    },
    ROCKET: {
      label: 'Rocket',
      number: settings.paymentRocketNumber,
    },
  };

  function toggleSavedProduct(productId: string) {
    setSavedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId],
    );
  }

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterSent(true);
  }

  function handleSearchChange(value: string) {
    setQuery(value);
    setActiveCategory('All');

    if (value.trim()) {
      window.setTimeout(() => {
        document.getElementById('shop')?.scrollIntoView({ block: 'start' });
      }, 0);
    }
  }

  return (
    <div className="premium-shell luxury-grid min-h-screen text-charcoal">
      <Navbar
        adminAccess={Boolean(isSignedIn && adminAccess)}
        announcementText={settings.announcementText}
        cartOpen={cartOpen}
        paymentWallets={paymentWallets}
        query={query}
        settings={settings}
        setCartOpen={setCartOpen}
        setQuery={handleSearchChange}
      />

      <main>
        <Hero featuredProduct={bestSellers[0] ?? collection[0]} settings={settings} />

        <AnimatePresence>
          {lastAdded ? (
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-spruce/20 bg-white/90 px-4 py-3 text-sm font-semibold text-charcoal shadow-2xl backdrop-blur-xl"
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
            >
              <CheckCircle2 className="size-5 text-spruce" />
              <span>{lastAdded} added to your bag.</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <TrustStrip settings={settings} />

        <section id="shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <Badge className="mb-4 border-bronze/25 bg-bronze/10 px-3 py-1 text-bronze" variant="outline">
                {settings.shopEyebrow}
              </Badge>
              <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl lg:text-5xl">
                {settings.shopTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-charcoal/65 lg:justify-self-end">
              {settings.shopDescription}
            </p>
          </div>

          <div className="mb-6 grid gap-3 rounded-[1.35rem] border border-charcoal/10 bg-white/70 p-3 shadow-luxury backdrop-blur-xl">
            <CategoryRail activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="px-2 text-sm font-medium text-charcoal/65">
                Showing <span className="text-charcoal">{filteredProducts.length}</span> curated pieces
                {query ? ` for "${query}"` : ''}
              </p>
              <label className="relative w-full sm:w-56">
                <span className="sr-only">Sort products</span>
                <select
                  className="h-11 w-full appearance-none rounded-full border border-charcoal/10 bg-white py-0 pl-4 pr-11 text-sm font-semibold text-charcoal outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-charcoal/55" />
              </label>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                saved={savedProductIds.includes(product.id)}
                stockLabel={getStockLabel(product)}
                onAddedToCart={(productName) => {
                  setLastAdded(productName);
                  setCartOpen(true);
                }}
                onToggleSave={() => toggleSavedProduct(product.id)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-charcoal/10 bg-white/75 p-10 text-center text-sm text-charcoal/65 shadow-luxury backdrop-blur-xl">
              No products matched your search. Try a different category or keyword.
            </div>
          ) : null}
        </section>

        {bestSellers.length > 0 ? (
          <BestSellers products={bestSellers} />
        ) : null}
        {activeOfferProduct ? (
          <OfferBand product={activeOfferProduct} />
        ) : null}
        <Reviews reviews={homeReviews} />
      </main>

      <Footer
        newsletterSent={newsletterSent}
        settings={settings}
        onNewsletterSubmit={handleNewsletterSubmit}
      />
    </div>
  );
}

function Navbar({
  adminAccess,
  announcementText,
  cartOpen,
  paymentWallets,
  query,
  settings,
  setCartOpen,
  setQuery,
}: {
  adminAccess: boolean;
  announcementText: string;
  cartOpen: boolean;
  paymentWallets: PaymentWalletMap;
  query: string;
  settings: StorefrontSettings;
  setCartOpen: (open: boolean) => void;
  setQuery: (value: string) => void;
}) {
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const cartLines = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateItemQuantity);
  const cartCount = useMemo(
    () => cartLines.reduce((total, item) => total + item.quantity, 0),
    [cartLines],
  );
  const cartSubtotal = useMemo(
    () =>
      cartLines.reduce(
        (total, item) => total + getSalePrice(item.product) * item.quantity,
        0,
      ),
    [cartLines],
  );
  const logoInitial = settings.brandName.trim().charAt(0).toUpperCase() || 'L';

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-ivory/84 shadow-[0_14px_44px_rgb(16_19_21/0.07)] backdrop-blur-2xl">
      {announcementVisible ? (
        <div className="relative overflow-hidden bg-charcoal px-10 py-2 text-center text-xs font-semibold tracking-wide text-ivory">
          <span className="mx-auto flex max-w-full items-center justify-center gap-2 overflow-hidden">
            <Sparkles className="size-3.5 shrink-0 text-gold" />
            <span className="truncate">{announcementText}</span>
          </span>
          <button
            aria-label="Close announcement"
            className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-ivory/70 transition-colors hover:bg-white/10 hover:text-ivory"
            onClick={() => setAnnouncementVisible(false)}
            type="button"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
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

        <nav className="ml-5 hidden items-center gap-1 rounded-full border border-charcoal/10 bg-white/65 p-1 text-sm text-charcoal/65 shadow-sm backdrop-blur-xl lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              className="whitespace-nowrap rounded-full px-4 py-2 transition-all hover:bg-charcoal hover:text-ivory"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-sm items-center rounded-full border border-charcoal/10 bg-white/82 px-4 shadow-sm backdrop-blur-xl md:flex">
          <Search className="size-4 text-charcoal/42" />
          <Input
            aria-label="Search products"
            className="h-11 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
            placeholder="Search Punjabi, silk, Eid..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <ClerkAuthControls />
          {adminAccess ? (
            <Link
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full border border-charcoal/10 bg-white/70 px-4 text-sm font-semibold text-charcoal/70 transition-all hover:bg-champagne hover:text-charcoal"
              href="/admin"
            >
              Admin
            </Link>
          ) : null}
        </div>

        {adminAccess ? <AdminNotificationSheet /> : null}

        <CartSheet
          cartCount={cartCount}
          cartLines={cartLines}
          cartOpen={cartOpen}
          cartSubtotal={cartSubtotal}
          paymentWallets={paymentWallets}
          removeItem={removeItem}
          setCartOpen={setCartOpen}
          updateQuantity={updateQuantity}
        />

        <MobileMenu
          adminAccess={adminAccess}
          query={query}
          settings={settings}
          setQuery={setQuery}
        />
      </div>
    </header>
  );
}

function AdminNotificationSheet() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AdminNotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/notifications', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Notifications could not be loaded.');
      }

      const nextData = (await response.json()) as AdminNotificationResponse;
      setData(nextData);
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : 'Notifications could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(task);
  }, [loadNotifications]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      void loadNotifications();
    }
  }

  const attentionCount = data?.counts.totalAttention ?? 0;
  const notifications = data?.notifications ?? [];
  const attentionItems = [
    {
      label: 'Pending orders',
      value: data?.counts.pendingOrders ?? 0,
    },
    {
      label: 'Hidden reviews',
      value: data?.counts.hiddenReviews ?? 0,
    },
    {
      label: 'Low stock',
      value: data?.counts.lowStockProducts ?? 0,
    },
    {
      label: 'Pending invites',
      value: data?.counts.pendingInvitations ?? 0,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            aria-label="Admin notifications"
            className="relative rounded-full border-charcoal/10 bg-white/70 shadow-sm"
            size="icon-lg"
            variant="outline"
          />
        }
      >
        <Bell className="size-4" />
        {attentionCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-oxblood text-[0.65rem] font-bold text-white shadow-lg">
            {attentionCount > 9 ? '9+' : attentionCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        className="w-full gap-0 border-charcoal/10 bg-ivory/95 shadow-2xl backdrop-blur-2xl sm:max-w-md"
        side="right"
      >
        <SheetHeader className="shrink-0 p-5">
          <SheetTitle className="text-xl font-semibold">Admin Notifications</SheetTitle>
          <SheetDescription>
            Latest orders, reviews, and items that need attention.
          </SheetDescription>
        </SheetHeader>

        <div className="border-t border-charcoal/10 p-5">
          <div className="grid grid-cols-2 gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                className="rounded-2xl border border-charcoal/10 bg-white/78 p-3 shadow-sm transition-colors hover:bg-white"
                href="/admin/dashboard"
              >
                <span className="block text-xs font-semibold text-charcoal/55">
                  {item.label}
                </span>
                <span className="mt-1 block text-2xl font-bold text-charcoal">
                  {item.value}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-charcoal/10 px-4 py-4 sm:px-5">
          {loading ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white/70 p-6 text-sm text-charcoal/60 shadow-sm">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-oxblood/20 bg-oxblood/10 p-6 text-sm font-semibold text-oxblood">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white/70 p-6 text-sm leading-6 text-charcoal/65 shadow-sm">
              No recent orders or reviews yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = notification.type === 'order' ? ShoppingBag : MessageSquare;

                return (
                  <Link
                    key={notification.id}
                    className="flex gap-3 rounded-2xl border border-charcoal/10 bg-white/86 p-3 shadow-sm transition-colors hover:bg-white"
                    href={notification.href}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-bronze">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-charcoal">
                        {notification.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-charcoal/60">
                        {notification.detail}
                      </span>
                      <span className="mt-2 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-charcoal/35">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-charcoal/10 bg-white/45 p-5">
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-charcoal px-4 text-sm font-bold text-ivory shadow-lg shadow-charcoal/15 transition-all hover:bg-ink"
            href="/admin/dashboard"
          >
            Open Admin Dashboard
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartSheet({
  cartCount,
  cartLines,
  cartOpen,
  cartSubtotal,
  paymentWallets,
  removeItem,
  setCartOpen,
  updateQuantity,
}: {
  cartCount: number;
  cartLines: CartItem[];
  cartOpen: boolean;
  cartSubtotal: number;
  paymentWallets: PaymentWalletMap;
  removeItem: (productId: string) => void;
  setCartOpen: (open: boolean) => void;
  updateQuantity: (productId: string, quantity: number) => void;
}) {
  const [paymentMethodId, setPaymentMethodId] = useState<(typeof paymentMethods)[number]['id']>('COD');
  const [paymentGateway, setPaymentGateway] = useState<ManualPaymentGateway>('BKASH');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [submittedOrderTotal, setSubmittedOrderTotal] = useState(0);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  const manualGatewayOptions = [
    {
      id: 'BKASH' as const,
      ...paymentWallets.BKASH,
      available: isManualPaymentWalletAvailable(paymentWallets.BKASH.number),
    },
    {
      id: 'NAGAD' as const,
      ...paymentWallets.NAGAD,
      available: isManualPaymentWalletAvailable(paymentWallets.NAGAD.number),
    },
    {
      id: 'ROCKET' as const,
      ...paymentWallets.ROCKET,
      available: isManualPaymentWalletAvailable(paymentWallets.ROCKET.number),
    },
  ];
  const firstAvailableGateway = manualGatewayOptions.find((gateway) => gateway.available);
  const activePaymentGateway =
    manualGatewayOptions.find((gateway) => gateway.id === paymentGateway && gateway.available)
      ?.id ??
    firstAvailableGateway?.id ??
    paymentGateway;
  const hasAvailableManualGateway = Boolean(firstAvailableGateway);
  const activePaymentMethodId =
    paymentMethodId === 'MANUAL' && !hasAvailableManualGateway ? 'COD' : paymentMethodId;
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.id === activePaymentMethodId) ?? paymentMethods[0];
  const selectedPaymentGateway = paymentWallets[activePaymentGateway];
  const couponDiscount = appliedCoupon
    ? Math.round(cartSubtotal * (appliedCoupon.discountPercent / 100))
    : 0;
  const checkoutTotal = Math.max(0, cartSubtotal - couponDiscount);

  function handleCartOpenChange(open: boolean) {
    if (!open && orderPlaced) {
      clearCart();
      setOrderPlaced(false);
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponMessage('');
      setCheckoutError('');
    }

    setCartOpen(open);
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage('Enter a coupon code.');
      return;
    }

    setApplyingCoupon(true);
    setCouponMessage('');

    try {
      const response = await fetch('/api/checkout/coupon', {
        body: JSON.stringify({ code, subtotal: cartSubtotal }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const data = (await response.json()) as {
        coupon?: { code: string; discountPercent: number };
        error?: string;
      };

      if (!response.ok || !data.coupon) {
        throw new Error(data.error ?? 'Coupon could not be applied.');
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discountPercent: data.coupon.discountPercent,
      });
      setCouponCode(data.coupon.code);
      setCouponMessage(`${data.coupon.discountPercent}% coupon applied.`);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error instanceof Error ? error.message : 'Coupon could not be applied.');
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartLines.length === 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setCheckoutError('');
    setSubmittingOrder(true);

    try {
      const response = await fetch('/api/checkout', {
        body: JSON.stringify({
          customerName: String(formData.get('customerName') ?? ''),
          customerPhone: String(formData.get('phone') ?? ''),
          deliveryAddress: String(formData.get('address') ?? ''),
          paymentMethod: activePaymentMethodId,
          paymentGateway: activePaymentMethodId === 'MANUAL' ? activePaymentGateway : null,
          paymentNumber: String(formData.get('paymentNumber') ?? ''),
          transactionId: String(formData.get('transactionId') ?? ''),
          couponCode: appliedCoupon?.code ?? '',
          items: cartLines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const data = (await response.json()) as {
        error?: string;
        order?: { id: string; totalAmount: number };
      };

      if (!response.ok || !data.order) {
        throw new Error(data.error ?? 'Unable to submit order.');
      }

      setSubmittedOrderId(data.order.id);
      setSubmittedOrderTotal(data.order.totalAmount);
      setOrderPlaced(true);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to submit order.');
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <Sheet open={cartOpen} onOpenChange={handleCartOpenChange}>
      <SheetTrigger
        render={<Button className="relative rounded-full border-charcoal/10 bg-white/70 shadow-sm" size="icon-lg" variant="outline" aria-label="Cart" />}
      >
        <ShoppingBag className="size-4" />
        {cartCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-oxblood text-[0.65rem] font-bold text-white shadow-lg">
            {cartCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 border-charcoal/10 bg-ivory/95 shadow-2xl backdrop-blur-2xl sm:max-w-md" side="right">
        <SheetHeader className="shrink-0 p-5">
          <SheetTitle className="text-xl font-semibold">Your Bag</SheetTitle>
          <SheetDescription>
            {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} ready for checkout.` : 'Your bag is empty.'}
          </SheetDescription>
        </SheetHeader>

        <div className="max-h-[38vh] shrink-0 space-y-3 overflow-y-auto border-t border-charcoal/10 px-4 py-4 sm:px-5">
          {cartLines.length === 0 ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white/70 p-6 text-sm leading-6 text-charcoal/65 shadow-sm">
              Add your favorite Punjabi pieces and checkout in a few clicks.
            </div>
          ) : (
            cartLines.map((item) => (
              <div key={item.product.id} className="flex min-h-28 gap-3 rounded-2xl border border-charcoal/10 bg-white/86 p-3 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={item.product.name}
                  className="h-24 w-24 shrink-0 rounded-xl object-cover object-top"
                  src={item.product.imageUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-bold leading-5 text-charcoal">{item.product.name}</p>
                    <button
                      aria-label={`Remove ${item.product.name}`}
                      className="rounded-full p-1 text-charcoal/45 transition-colors hover:bg-oxblood/10 hover:text-oxblood"
                      onClick={() => removeItem(item.product.id)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm font-bold text-bronze">{formatPrice(getSalePrice(item.product))}</p>
                  <div className="mt-3 flex items-center gap-2 text-charcoal">
                    <Button
                      aria-label={`Decrease quantity for ${item.product.name}`}
                      size="icon-xs"
                      type="button"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      aria-label={`Increase quantity for ${item.product.name}`}
                      size="icon-xs"
                      type="button"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-charcoal/10 bg-white/45 p-5">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-charcoal/65">Subtotal</span>
            <span className="text-lg font-bold text-charcoal">{formatPrice(cartSubtotal)}</span>
          </div>
          {couponDiscount > 0 ? (
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-charcoal/65">Coupon discount</span>
              <span className="font-bold text-spruce">-{formatPrice(couponDiscount)}</span>
            </div>
          ) : null}
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-charcoal px-4 py-3 text-sm text-ivory">
            <span>Total</span>
            <span className="text-lg font-bold text-gold">{formatPrice(checkoutTotal)}</span>
          </div>

          {orderPlaced && cartLines.length > 0 ? (
            <div className="rounded-[1.25rem] border border-spruce/20 bg-spruce/10 p-4" aria-live="polite">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-spruce" />
                <div>
                  <p className="text-sm font-bold text-charcoal">Order request is ready.</p>
                  <p className="mt-1 text-xs leading-5 text-charcoal/62">
                    Order #{submittedOrderId.slice(-8).toUpperCase()}. Payment: {selectedPaymentMethod.label}.
                    Total: {formatPrice(submittedOrderTotal)}. Keep your payment reference and confirm delivery by phone.
                  </p>
                </div>
              </div>
              <Button
                className="mt-4 h-11 w-full rounded-full bg-charcoal text-ivory hover:bg-ink"
                onClick={() => handleCartOpenChange(false)}
                type="button"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleCheckoutSubmit}>
              <div className="rounded-[1.25rem] border border-charcoal/10 bg-white/75 p-3">
                <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                  Coupon code
                  <span className="flex gap-2">
                    <Input
                      className="h-11 rounded-2xl bg-white px-4 uppercase"
                      name="couponCode"
                      placeholder="LIBASYA500"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                    />
                    <Button
                      className="h-11 rounded-2xl border-charcoal/10 bg-white px-4"
                      disabled={applyingCoupon || cartLines.length === 0}
                      onClick={applyCoupon}
                      type="button"
                      variant="outline"
                    >
                      {applyingCoupon ? 'Checking' : 'Apply'}
                    </Button>
                  </span>
                </label>
                {couponMessage ? (
                  <p
                    className={cn(
                      'mt-2 text-xs font-semibold',
                      appliedCoupon ? 'text-spruce' : 'text-oxblood',
                    )}
                    aria-live="polite"
                  >
                    {couponMessage}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                  Full name
                  <Input
                    className="h-11 rounded-2xl bg-white px-4"
                    name="customerName"
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                  Phone number
                  <Input
                    className="h-11 rounded-2xl bg-white px-4"
                    inputMode="tel"
                    name="phone"
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                  Delivery address
                  <Input
                    className="h-11 rounded-2xl bg-white px-4"
                    name="address"
                    placeholder="House, road, area, city"
                    required
                  />
                </label>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-charcoal/70">Payment method</legend>
                <div className="grid gap-2">
                  {paymentMethods.map((method) => {
                    const methodDisabled = method.id === 'MANUAL' && !hasAvailableManualGateway;

                    return (
                      <label
                        key={method.id}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border bg-white/75 p-3 transition-all',
                          methodDisabled
                            ? 'cursor-not-allowed border-charcoal/5 bg-charcoal/5 text-charcoal/35'
                            : 'cursor-pointer',
                          activePaymentMethodId === method.id && !methodDisabled
                            ? 'border-charcoal/30 shadow-sm'
                            : 'border-charcoal/10',
                          !methodDisabled && activePaymentMethodId !== method.id
                            ? 'hover:border-charcoal/20'
                            : null,
                        )}
                      >
                        <input
                          checked={activePaymentMethodId === method.id}
                          className="mt-1 accent-charcoal disabled:cursor-not-allowed"
                          disabled={methodDisabled}
                          name="paymentMethod"
                          onChange={() => {
                            if (!methodDisabled) {
                              setPaymentMethodId(method.id);
                            }
                          }}
                          type="radio"
                          value={method.id}
                        />
                        <span>
                          <span
                            className={cn(
                              'block text-sm font-bold',
                              methodDisabled ? 'text-charcoal/35' : 'text-charcoal',
                            )}
                          >
                            {method.label}
                          </span>
                          <span
                            className={cn(
                              'mt-0.5 block text-xs leading-5',
                              methodDisabled ? 'text-charcoal/35' : 'text-charcoal/58',
                            )}
                          >
                            {methodDisabled ? 'Currently unavailable.' : method.note}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {activePaymentMethodId === 'MANUAL' ? (
                <div className="space-y-3 rounded-[1.25rem] border border-bronze/20 bg-bronze/10 p-3">
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-bold text-charcoal/70">Select gateway</legend>
                    <div className="grid gap-2">
                      {manualGatewayOptions.map((gateway) => (
                        <label
                          key={gateway.id}
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-2xl border bg-white/75 p-3 transition-all',
                            gateway.available
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed border-charcoal/5 bg-charcoal/5 text-charcoal/35',
                            activePaymentGateway === gateway.id && gateway.available
                              ? 'border-charcoal/30 shadow-sm'
                              : 'border-charcoal/10',
                            gateway.available && activePaymentGateway !== gateway.id
                              ? 'hover:border-charcoal/20'
                              : null,
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <input
                              checked={activePaymentGateway === gateway.id}
                              className="accent-charcoal disabled:cursor-not-allowed"
                              disabled={!gateway.available}
                              name="paymentGateway"
                              onChange={() => {
                                if (gateway.available) {
                                  setPaymentGateway(gateway.id);
                                }
                              }}
                              type="radio"
                              value={gateway.id}
                            />
                            <span
                              className={cn(
                                'text-sm font-bold',
                                gateway.available ? 'text-charcoal' : 'text-charcoal/35',
                              )}
                            >
                              {gateway.label}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              gateway.available ? 'text-bronze' : 'text-charcoal/35',
                            )}
                          >
                            {gateway.available ? gateway.number : 'Unavailable'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="rounded-2xl bg-charcoal px-4 py-3 text-sm text-ivory">
                    Send payment to{' '}
                    <span className="font-bold text-gold">{selectedPaymentGateway.label}</span> number{' '}
                    <span className="font-bold text-gold">{selectedPaymentGateway.number}</span>, then submit details.
                  </div>
                  <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                    Sender phone number
                    <Input
                      className="h-11 rounded-2xl bg-white px-4"
                      inputMode="tel"
                      name="paymentNumber"
                      placeholder="Number used to send payment"
                      required
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-bold text-charcoal/70">
                    Transaction ID (TxnID)
                    <Input
                      className="h-11 rounded-2xl bg-white px-4"
                      name="transactionId"
                      placeholder="Enter payment TxnID"
                      required
                    />
                  </label>
                </div>
              ) : null}

              <Button
                className="h-12 w-full rounded-full bg-charcoal text-ivory shadow-lg shadow-charcoal/15 hover:bg-ink"
                disabled={
                  cartLines.length === 0 ||
                  submittingOrder ||
                  (activePaymentMethodId === 'MANUAL' && !hasAvailableManualGateway)
                }
                type="submit"
              >
                {submittingOrder ? 'Submitting...' : 'Submit Order Request'}
                <ArrowRight className="size-4" />
              </Button>
              {checkoutError ? (
                <p className="text-xs font-semibold text-oxblood" aria-live="polite">
                  {checkoutError}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileMenu({
  adminAccess,
  query,
  settings,
  setQuery,
}: {
  adminAccess: boolean;
  query: string;
  settings: StorefrontSettings;
  setQuery: (value: string) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="rounded-full border-charcoal/10 bg-white/70 lg:hidden" size="icon-lg" variant="outline" aria-label="Open menu" />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent className="bg-ivory/95 backdrop-blur-2xl" side="right">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">{settings.brandName}</SheetTitle>
          <SheetDescription>{settings.brandTagline} ready to shop.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <div className="mb-5 flex items-center rounded-2xl border border-charcoal/10 bg-white/80 px-3 shadow-sm">
            <Search className="size-4 text-charcoal/45" />
            <Input
              aria-label="Search products"
              className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
              placeholder="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-charcoal/70 transition-colors hover:bg-white hover:text-charcoal"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            <ClerkAuthControls mobile />
            {adminAccess ? (
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-charcoal/70 transition-colors hover:bg-white hover:text-charcoal"
                href="/admin"
              >
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Hero({
  featuredProduct,
  settings,
}: {
  featuredProduct?: StorefrontProduct;
  settings: StorefrontSettings;
}) {
  const backgroundImage = settings.heroImageUrl || fallbackHeroImage;

  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-ivory">
      <div className="absolute inset-0 -z-30 bg-cover bg-center opacity-[0.68]" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(16,19,21,0.98)_0%,rgba(16,19,21,0.86)_42%,rgba(16,19,21,0.48)_100%),linear-gradient(180deg,rgba(16,19,21,0.35)_0%,rgba(16,19,21,0.08)_48%,rgba(16,19,21,0.82)_100%)]" />

      <div className="mx-auto grid min-h-[700px] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:min-h-[760px] lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
          initial={{ opacity: 0, y: 22 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Badge className="mb-5 border-gold/30 bg-gold/15 px-3 py-1 text-gold" variant="outline">
            <Sparkles className="size-3" />
            {settings.heroBadge}
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            {settings.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-ivory/82 sm:text-lg">
            {settings.heroSubtitle}
          </p>
          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-charcoal shadow-2xl shadow-gold/20 transition-all hover:-translate-y-0.5 hover:bg-[#f1cb74] sm:w-auto"
              href="/shop"
            >
              {settings.heroPrimaryCta}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="inline-flex h-12 w-full items-center justify-center rounded-full border border-ivory/25 bg-ivory/8 px-6 text-sm font-bold text-ivory backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-ivory/15 sm:w-auto"
              href="/offers"
            >
              {settings.heroSecondaryCta}
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 text-center sm:grid-cols-3">
            {[
              ['4.9/5', 'Customer rating'],
              ['24h', 'Dispatch'],
              ['500+', 'Pieces sold'],
            ].map(([value, label]) => (
              <div key={label} className="dark-glass-card rounded-[1.35rem] p-4">
                <p className="text-xl font-bold text-gold sm:text-2xl">{value}</p>
                <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ivory/58">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
          initial={{ opacity: 0, x: 28 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div className="relative ml-auto max-w-[25rem]">
            <div className="absolute -left-8 top-9 z-10 rounded-[1.35rem] border border-ivory/18 bg-charcoal/42 p-4 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gold text-charcoal">
                  <Crown className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{settings.heroCardTitle}</p>
                  <p className="text-xs text-ivory/62">{settings.heroCardSubtitle}</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-ivory/16 bg-ivory/12 p-3 shadow-[0_34px_100px_rgb(0_0_0/0.42)] backdrop-blur-xl">
              {featuredProduct ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={featuredProduct.name}
                  className="aspect-[4/5] rounded-[1.35rem] object-cover"
                  src={featuredProduct.imageUrl}
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center rounded-[1.35rem] border border-dashed border-ivory/20 bg-charcoal/38 p-6 text-center">
                  <div>
                    <Package className="mx-auto mb-3 size-8 text-gold" />
                    <p className="text-sm font-semibold text-ivory">No products yet</p>
                    <p className="mt-2 text-xs leading-5 text-ivory/55">
                      Add your first product from the admin dashboard.
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-3 rounded-[1.25rem] bg-charcoal/72 p-4 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">
                      {featuredProduct?.name ?? 'Catalog starts empty'}
                    </p>
                    <p className="mt-1 text-xs text-ivory/58">
                      {featuredProduct ? settings.heroProductSubtitle : 'Product count: 0'}
                    </p>
                  </div>
                  {featuredProduct ? (
                    <p className="text-sm font-bold text-gold">
                      {formatPrice(getSalePrice(featuredProduct))}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-[1.35rem] border border-ivory/16 bg-charcoal/44 px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-2xl">
              <span className="inline-flex items-center gap-2 text-gold">
                <Gem className="size-4" />
                {settings.heroRibbonText}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip({ settings }: { settings: StorefrontSettings }) {
  const trustItems = [
    { icon: ShieldCheck, label: settings.trustOneLabel, text: settings.trustOneText },
    { icon: Truck, label: settings.trustTwoLabel, text: settings.trustTwoText },
    { icon: BadgeCheck, label: settings.trustThreeLabel, text: settings.trustThreeText },
  ];

  return (
    <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass-card grid gap-3 rounded-[1.5rem] p-3 sm:grid-cols-3">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-[1.15rem] bg-white/72 px-4 py-4 text-sm text-charcoal/72"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-charcoal text-gold shadow-lg shadow-charcoal/10">
              <item.icon className="size-5" />
            </span>
            <span>
              <span className="block font-bold text-charcoal">{item.label}</span>
              <span className="text-xs text-charcoal/55">{item.text}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryRail({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}) {
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-full bg-champagne/42 p-2">
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
  );
}

function ProductCard({
  product,
  onAddedToCart,
  onToggleSave,
  saved,
  stockLabel,
}: {
  product: StorefrontProduct;
  onAddedToCart: (productName: string) => void;
  onToggleSave: () => void;
  saved: boolean;
  stockLabel: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const salePrice = getSalePrice(product);
  const originalPrice = Math.round(product.originalPrice ?? product.price);
  const discount = product.discount ?? product.discountPercent;
  const savings = originalPrice - salePrice;
  const stockPercent = Math.min(100, Math.max(8, product.stock * 9));
  const countdown = useOfferCountdown(product.offerEndsAt);
  const hasLiveOffer = Boolean(product.offerCode && product.offerEndsAt && !countdown.expired);

  function handleAddToCart() {
    addItem(product);
    onAddedToCart(product.name);
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
    >
      <Card className="flex h-full flex-col rounded-[1.45rem] border-charcoal/10 bg-white/88 p-0 shadow-luxury backdrop-blur-xl transition-all duration-300 hover:border-bronze/30 hover:shadow-2xl">
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
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-charcoal/58 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {discount > 0 ? (
              <Badge className="bg-oxblood px-3 py-1 text-white shadow-lg">{discount}% Off</Badge>
            ) : null}
            {hasLiveOffer ? (
              <Badge className="border-gold/45 bg-gold/90 px-3 py-1 text-charcoal shadow-lg" variant="outline">
                Code {product.offerCode}
              </Badge>
            ) : null}
            <Badge className="border-white/45 bg-white/86 px-3 py-1 text-charcoal shadow-sm" variant="outline">
              {stockLabel}
            </Badge>
          </div>
          <button
            aria-label={`Save ${product.name}`}
            aria-pressed={saved}
            className={cn(
              'absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/88 text-charcoal shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-white hover:text-oxblood',
              saved && 'bg-oxblood text-white hover:bg-oxblood hover:text-white',
            )}
            onClick={onToggleSave}
            type="button"
          >
            <Heart className={cn('size-4', saved && 'fill-current')} />
          </button>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star key={starIndex} className="size-3.5 fill-current" />
              ))}
              <span className="ml-1 text-xs font-bold text-white/78">4.9</span>
            </div>
            <Badge className="border-white/30 bg-white/16 text-white backdrop-blur" variant="outline">
              {getProductCategory(product)}
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
        <CardContent className="flex flex-1 flex-col px-5">
          <p className="min-h-12 text-sm leading-6 text-charcoal/65">
            {product.description ?? 'Premium Punjabi wear with clean finishing and a comfortable fit.'}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <p className="text-2xl font-bold text-charcoal">{formatPrice(salePrice)}</p>
            {discount > 0 ? (
              <p className="pb-1 text-sm text-charcoal/45 line-through">{formatPrice(originalPrice)}</p>
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
          <div className="mt-auto pt-5">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-charcoal/55">
              <span>Stock</span>
              <span>{product.stock} left</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-charcoal/10">
              <div className="h-full rounded-full bg-gradient-to-r from-bronze to-gold" style={{ width: `${stockPercent}%` }} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-0 bg-transparent p-5 pt-0">
          <Button
            className="h-11 w-full rounded-full bg-charcoal text-ivory shadow-lg shadow-charcoal/15 hover:bg-ink"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
          >
            {product.stock <= 0 ? 'Sold Out' : 'Add to Bag'}
            <ShoppingBag className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function BestSellers({
  products,
}: {
  products: StorefrontProduct[];
}) {
  return (
    <section id="best-sellers" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[1.7rem] bg-charcoal p-5 text-ivory shadow-2xl sm:p-8 lg:p-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge className="mb-3 border-gold/30 bg-gold/15 px-3 py-1 text-gold" variant="outline">
              Best Sellers
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Most added this week
            </h2>
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-gold transition-colors hover:text-ivory" href="/shop">
            Shop all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product, index) => (
            <Link
              key={product.id}
              className="group flex items-center gap-4 rounded-[1.25rem] border border-ivory/10 bg-ivory/8 p-3 text-left backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-ivory/14 hover:shadow-2xl"
              href={`/products/${product.id}`}
              prefetch={true}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.name}
                className="size-24 rounded-2xl object-cover object-top shadow-lg"
                decoding="async"
                loading="lazy"
                src={product.imageUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">#{index + 1} Bestseller</p>
                <h3 className="mt-1 truncate text-sm font-semibold text-ivory">{product.name}</h3>
                <p className="mt-2 text-sm font-bold text-ivory">{formatPrice(getSalePrice(product))}</p>
              </div>
              <ArrowRight className="size-5 text-ivory/45 transition-colors group-hover:text-gold" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
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

function OfferBand({ product }: { product: StorefrontProduct }) {
  const countdown = useOfferCountdown(product.offerEndsAt);
  const salePrice = getSalePrice(product);
  const originalPrice = Math.round(product.originalPrice ?? product.price);

  return (
    <section id="offers" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[1.7rem] bg-charcoal bg-[linear-gradient(135deg,rgba(228,189,99,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] p-6 text-ivory shadow-2xl sm:p-8 md:grid-cols-[1.1fr_0.9fr] md:items-center lg:p-12">
        <div className="relative">
          <Badge className="mb-4 border-bronze/40 bg-bronze/15 px-3 py-1 text-gold" variant="outline">
            Product Offer
          </Badge>
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {product.name}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ivory/70">
            {product.description ?? 'Limited-time product offer is live now.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge className="border-gold/40 bg-gold/15 px-3 py-1 text-gold" variant="outline">
              Code: {product.offerCode}
            </Badge>
            <span className="text-sm font-bold text-gold">{formatPrice(salePrice)}</span>
            {originalPrice > salePrice ? (
              <span className="text-sm text-ivory/45 line-through">
                {formatPrice(originalPrice)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="relative mt-8 rounded-[1.35rem] border border-ivory/15 bg-ivory/10 p-5 backdrop-blur-xl md:mt-0">
          <div className="grid grid-cols-3 gap-3 text-center">
            {countdown.parts.map(([value, label]) => (
              <div key={label} className="rounded-[1.15rem] bg-charcoal/35 p-4 shadow-inner">
                <p className="text-2xl font-bold text-gold sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-ivory/58">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-semibold text-ivory/65">
            {countdown.expired ? 'Offer refreshes soon.' : 'Limited-time offer live now.'}
          </p>
          <Link
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-charcoal shadow-lg shadow-gold/15 transition-all hover:bg-[#f1cb74]"
            href="/shop"
          >
            Shop Offer Product
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Reviews({ reviews }: { reviews: StorefrontReview[] }) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <Badge className="mb-3 border-spruce/20 bg-spruce/10 px-3 py-1 text-spruce" variant="outline">
          Customer Love
        </Badge>
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Built for repeat customers.
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="glass-card rounded-[1.35rem] p-6 transition-transform hover:-translate-y-1">
            <div className="mb-4 flex text-gold">
              {Array.from({ length: review.rating }).map((_, index) => (
                <Star key={index} className="size-4 fill-current" />
              ))}
            </div>
            <p className="text-sm leading-7 text-charcoal/72">&ldquo;{review.quote}&rdquo;</p>
            <p className="mt-5 text-sm font-bold text-charcoal">{review.author}</p>
            {review.productName ? (
              <p className="mt-1 text-xs font-semibold text-charcoal/45">{review.productName}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({
  newsletterSent,
  settings,
  onNewsletterSubmit,
}: {
  newsletterSent: boolean;
  settings: StorefrontSettings;
  onNewsletterSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const logoInitial = settings.brandName.trim().charAt(0).toUpperCase() || 'L';

  return (
    <footer className="px-4 pb-8 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[1.7rem] border border-charcoal/10 bg-white/74 p-6 shadow-luxury backdrop-blur-xl lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr_1fr]">
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
            <p className="mt-5 max-w-xs text-sm leading-7 text-charcoal/65">
              {settings.footerDescription}
            </p>
            <div className="mt-4 space-y-1 text-sm font-medium text-charcoal/60">
              <p>{settings.contactPhone}</p>
              <p>{settings.contactEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {[
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
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-bold text-charcoal">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-charcoal/62">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link className="transition-colors hover:text-charcoal" href={link.href}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-bold text-charcoal">Drop Alerts</h3>
            <p className="mt-3 text-sm leading-7 text-charcoal/65">
              Get first access to new Punjabi drops, restocks, and private discounts.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={onNewsletterSubmit}>
              <Input
                aria-label="Email address"
                className="h-11 rounded-full bg-white px-4"
                placeholder="Email address"
                type="email"
                required
              />
              <Button className="size-11 rounded-full bg-charcoal text-ivory hover:bg-ink" type="submit">
                <Mail className="size-4" />
              </Button>
            </form>
            {newsletterSent ? (
              <p className="mt-2 text-xs font-bold text-spruce">You are on the list.</p>
            ) : null}
            <div className="mt-5 flex gap-2">
              {[
                { label: 'Instagram', icon: Camera, href: 'https://www.instagram.com/' },
                { label: 'Community', icon: Globe2, href: '/reviews' },
                { label: 'Message', icon: Send, href: '/contact' },
              ].map((item) => (
                <a
                  key={item.label}
                  aria-label={item.label}
                  className="flex size-10 items-center justify-center rounded-full border border-charcoal/10 bg-white/75 text-charcoal/65 transition-all hover:-translate-y-0.5 hover:bg-charcoal hover:text-ivory"
                  href={item.href}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                >
                  <item.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-charcoal/10" />

        <div className="flex flex-col justify-between gap-3 text-xs text-charcoal/55 sm:flex-row">
          <p>(c) 2026 {settings.brandName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className={cn('hover:text-charcoal')} href="/privacy">
              Privacy
            </Link>
            <Link className={cn('hover:text-charcoal')} href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
