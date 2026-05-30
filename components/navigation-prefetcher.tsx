'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const warmRoutes = [
  '/',
  '/shop',
  '/best-sellers',
  '/new-arrivals',
  '/weekend-offers',
  '/offers',
  '/reviews',
  '/about',
  '/contact',
  '/delivery',
  '/returns',
  '/size-guide',
  '/checkout',
];

export function NavigationPrefetcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const warmNavigation = () => {
      if (cancelled) {
        return;
      }

      for (const route of warmRoutes) {
        if (route !== pathname) {
          router.prefetch(route);
        }
      }
    };

    const timerId = window.setTimeout(warmNavigation, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [pathname, router]);

  return null;
}
