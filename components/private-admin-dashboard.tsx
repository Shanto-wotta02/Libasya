'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgePercent,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Home,
  LogOut,
  MailPlus,
  MessageSquare,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  TicketPercent,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

import { AdminContentPanel } from '@/components/admin-content-panel';
import { OurUploadButton } from '@/components/our-upload-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CUSTOMER';
};

type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  discountPercent: number;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  imageUrl: string;
  category: string;
  stock: number;
  featured: boolean;
  offerCode: string | null;
  offerEndsAt: string | null;
  createdAt: string;
};

type AdminCoupon = {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
};

type AdminInvitation = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'CUSTOMER';
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
  acceptedAt: string | null;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
  acceptedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type AdminReview = {
  id: string;
  quote: string;
  author: string;
  rating: number;
  isPublished: boolean;
  featuredOnHome: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
};

const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'] as const;

type AdminOrderStatus = (typeof orderStatuses)[number];

type AdminOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: 'COD' | 'MANUAL';
  paymentGateway: 'BKASH' | 'NAGAD' | 'ROCKET' | null;
  paymentNumber: string | null;
  transactionId: string | null;
  couponCode: string | null;
  couponDiscountPercent: number;
  totalAmount: number;
  status: AdminOrderStatus;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      imageUrl: string;
    };
  }>;
};

type ProductForm = {
  id: string;
  name: string;
  description: string;
  originalPrice: string;
  discount: string;
  stock: string;
  imageUrl: string;
  category: string;
  featured: boolean;
  offerCode: string;
  offerEndsAt: string;
};

type CouponForm = {
  code: string;
  discountPercent: string;
  expiryDate: string;
};

type DashboardTab = 'Overview' | 'Products' | 'Coupons' | 'Orders' | 'Reviews' | 'Access' | 'Content';

type Message = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

const emptyProductForm: ProductForm = {
  id: '',
  name: '',
  description: '',
  originalPrice: '',
  discount: '0',
  stock: '0',
  imageUrl: '',
  category: 'Premium',
  featured: false,
  offerCode: '',
  offerEndsAt: '',
};

const productCategories = ['Premium', 'Wedding', 'Festive', 'Everyday'];

const dashboardTabs: Array<{
  id: DashboardTab;
  label: string;
  icon: typeof Package;
}> = [
  { id: 'Overview', label: 'Admin Home', icon: Home },
  { id: 'Products', label: 'Product Management', icon: Package },
  { id: 'Coupons', label: 'Coupon Control', icon: TicketPercent },
  { id: 'Orders', label: 'Order Verification', icon: ClipboardList },
  { id: 'Reviews', label: 'Review Control', icon: MessageSquare },
  { id: 'Access', label: 'Admin Access', icon: UserPlus },
  { id: 'Content', label: 'Website Content', icon: FileText },
];

function getDefaultExpiryDate() {
  const date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  return date.toISOString().slice(0, 10);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const emptyCouponForm: CouponForm = {
  code: '',
  discountPercent: '10',
  expiryDate: getDefaultExpiryDate(),
};

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function calculateCurrentPrice(originalPrice: number, discount: number) {
  const cleanDiscount = Math.min(90, Math.max(0, Math.round(discount || 0)));

  return Math.round(Math.max(0, originalPrice || 0) * ((100 - cleanDiscount) / 100));
}

function getProductPrice(product: AdminProduct) {
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const discount = Number(product.discount ?? product.discountPercent ?? 0);
  const currentPrice =
    Number(product.currentPrice || 0) > 0
      ? Number(product.currentPrice)
      : calculateCurrentPrice(originalPrice, discount);

  return { originalPrice, currentPrice, discount };
}

function parseApiError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  return data?.error ?? fallback;
}

function sortNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function upsertNewest<T extends { id: string; createdAt: string }>(items: T[], item: T) {
  const nextItems = items.some((currentItem) => currentItem.id === item.id)
    ? items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    : [item, ...items];

  return sortNewestFirst(nextItems);
}

function formatRole(role: AdminInvitation['role']) {
  return role === 'ADMIN' ? 'Admin' : 'User';
}

const panelClass =
  'rounded-lg border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-xl';
const fieldClass =
  'h-10 border-white/10 bg-white/[0.08] text-[#f7efe2] placeholder:text-white/35 focus-visible:ring-gold/45';
const textAreaClass =
  'mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-sm text-[#f7efe2] outline-none placeholder:text-white/35 focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/30';
const selectClass =
  'h-10 w-full rounded-lg border border-white/10 bg-[#15110d] px-3 pr-9 text-sm text-[#f7efe2] outline-none focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/30';

export function PrivateAdminDashboard({ admin }: { admin: AdminProfile }) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('Overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [adminInvitationsEnabled, setAdminInvitationsEnabled] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCouponForm);

  const loadDashboard = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }

    try {
      const [productsResponse, couponsResponse, ordersResponse, invitationsResponse, reviewsResponse] = await Promise.all([
        fetch('/api/admin/products', { cache: 'no-store' }),
        fetch('/api/admin/coupons', { cache: 'no-store' }),
        fetch('/api/admin/orders', { cache: 'no-store' }),
        fetch('/api/admin/invitations', { cache: 'no-store' }),
        fetch('/api/admin/reviews', { cache: 'no-store' }),
      ]);

      if (
        productsResponse.status === 401 ||
        couponsResponse.status === 401 ||
        ordersResponse.status === 401 ||
        invitationsResponse.status === 401 ||
        reviewsResponse.status === 401
      ) {
        window.location.href = '/admin';
        return;
      }

      if (
        !productsResponse.ok ||
        !couponsResponse.ok ||
        !ordersResponse.ok ||
        !invitationsResponse.ok ||
        !reviewsResponse.ok
      ) {
        throw new Error('Dashboard data could not be loaded.');
      }

      const [productsData, couponsData, ordersData, invitationsData, reviewsData] = (await Promise.all([
        productsResponse.json(),
        couponsResponse.json(),
        ordersResponse.json(),
        invitationsResponse.json(),
        reviewsResponse.json(),
      ])) as [
        { products: AdminProduct[] },
        { coupons: AdminCoupon[] },
        { orders: AdminOrder[] },
        { adminInvitationsEnabled?: boolean; invitations: AdminInvitation[] },
        { reviews: AdminReview[] },
      ];

      setProducts(productsData.products);
      setCoupons(couponsData.coupons);
      setOrders(ordersData.orders);
      setInvitations(invitationsData.invitations);
      setReviews(reviewsData.reviews);
      setAdminInvitationsEnabled(invitationsData.adminInvitationsEnabled !== false);
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Dashboard data could not be loaded.'),
      });
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(task);
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'Pending').length;
    const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;
    const stockUnits = products.reduce((total, product) => total + product.stock, 0);
    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock <= 3,
    ).length;
    const pendingInvitations = invitations.filter(
      (invitation) => invitation.status === 'PENDING',
    ).length;
    const hiddenReviews = reviews.filter((review) => !review.isPublished).length;

    return [
      {
        label: 'Catalog Items',
        value: products.length,
        helper: `${stockUnits} stock units`,
        icon: Package,
      },
      {
        label: 'Order Queue',
        value: pendingOrders,
        helper: `${orders.length} total order${orders.length === 1 ? '' : 's'}`,
        icon: ClipboardList,
      },
      {
        label: 'Active Coupons',
        value: activeCoupons,
        helper: `${lowStockProducts} low-stock product${lowStockProducts === 1 ? '' : 's'}`,
        icon: BadgePercent,
      },
      {
        label: 'Hidden Reviews',
        value: hiddenReviews,
        helper: `${pendingInvitations} admin invite${pendingInvitations === 1 ? '' : 's'}`,
        icon: MessageSquare,
      },
    ];
  }, [coupons, invitations, orders, products, reviews]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.category, product.description ?? ''].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [productSearch, products]);

  const filteredReviews = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) =>
      [
        review.quote,
        review.author,
        review.user?.email ?? '',
        review.product?.name ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [reviewSearch, reviews]);

  const featuredReviewCount = reviews.filter((review) => review.featuredOnHome).length;

  const productPreview = calculateCurrentPrice(
    Number(productForm.originalPrice),
    Number(productForm.discount),
  );

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/products', {
        method: productForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productForm.id || undefined,
          name: productForm.name,
          description: productForm.description,
          originalPrice: Number(productForm.originalPrice),
          discount: Number(productForm.discount),
          stock: Number(productForm.stock),
          imageUrl: productForm.imageUrl,
          category: productForm.category,
          featured: productForm.featured,
          offerCode: productForm.offerCode,
          offerEndsAt: fromDateTimeLocal(productForm.offerEndsAt),
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Product could not be saved.'));
      }

      const data = (await response.json()) as { product?: AdminProduct };

      if (!data.product) {
        throw new Error('Product could not be saved.');
      }

      setProducts((currentProducts) => upsertNewest(currentProducts, data.product as AdminProduct));
      setProductForm(emptyProductForm);
      setMessage({
        tone: 'success',
        text: productForm.id ? 'Product updated.' : 'Product added.',
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Product could not be saved.'),
      });
    } finally {
      setSaving(false);
    }
  }

  function editProduct(product: AdminProduct) {
    const { originalPrice, discount } = getProductPrice(product);

    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      originalPrice: String(Math.round(originalPrice)),
      discount: String(Math.round(discount)),
      stock: String(product.stock),
      imageUrl: product.imageUrl,
      category: product.category,
      featured: product.featured,
      offerCode: product.offerCode ?? '',
      offerEndsAt: toDateTimeLocal(product.offerEndsAt),
    });
    setActiveTab('Products');
    window.scrollTo({ top: 0 });
  }

  function handleProductImageUploadBegin() {
    setUploadingImage(true);
    setMessage(null);
  }

  function handleProductImageUploaded(imageUrl: string) {
    setProductForm((currentForm) => ({
      ...currentForm,
      imageUrl,
    }));
    setMessage({ tone: 'success', text: 'Product image uploaded.' });
    setUploadingImage(false);
  }

  function handleProductImageUploadError(error: Error) {
    setMessage({
      tone: 'error',
      text: parseApiError(error, 'Image could not be uploaded.'),
    });
    setUploadingImage(false);
  }

  async function deleteProduct(productId: string) {
    const shouldDelete = window.confirm('Delete this product from the admin catalog?');

    if (!shouldDelete) {
      return false;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Product could not be deleted.'));
      }

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId),
      );
      setMessage({ tone: 'success', text: 'Product deleted.' });
      return true;
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Product could not be deleted.'),
      });
      return false;
    }
  }

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code,
          discountPercent: Number(couponForm.discountPercent),
          expiryDate: new Date(`${couponForm.expiryDate}T23:59:59`).toISOString(),
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Coupon could not be saved.'));
      }

      const data = (await response.json()) as { coupon?: AdminCoupon };

      if (!data.coupon) {
        throw new Error('Coupon could not be saved.');
      }

      setCoupons((currentCoupons) => upsertNewest(currentCoupons, data.coupon as AdminCoupon));
      setCouponForm(emptyCouponForm);
      setMessage({ tone: 'success', text: 'Coupon saved.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Coupon could not be saved.'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: AdminCoupon) {
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Coupon status could not be changed.'));
      }

      const data = (await response.json()) as { coupon?: AdminCoupon };

      if (!data.coupon) {
        throw new Error('Coupon status could not be changed.');
      }

      setCoupons((currentCoupons) => upsertNewest(currentCoupons, data.coupon as AdminCoupon));
      setMessage({
        tone: 'success',
        text: coupon.isActive ? 'Coupon paused.' : 'Coupon activated.',
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Coupon status could not be changed.'),
      });
    }
  }

  async function deleteCoupon(couponId: string) {
    try {
      const response = await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Coupon could not be deleted.'));
      }

      setCoupons((currentCoupons) =>
        currentCoupons.filter((coupon) => coupon.id !== couponId),
      );
      setMessage({ tone: 'success', text: 'Coupon deleted.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Coupon could not be deleted.'),
      });
    }
  }

  async function updateOrderStatus(orderId: string, status: AdminOrderStatus) {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Order status could not be updated.'));
      }

      const data = (await response.json()) as { order?: AdminOrder };

      if (!data.order) {
        throw new Error('Order status could not be updated.');
      }

      setOrders((currentOrders) => upsertNewest(currentOrders, data.order as AdminOrder));
      setMessage({ tone: 'success', text: `Order moved to ${status}.` });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Order status could not be updated.'),
      });
    }
  }

  async function updateReview(reviewId: string, patch: Partial<Pick<AdminReview, 'displayOrder' | 'featuredOnHome' | 'isPublished'>>) {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId,
          ...patch,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Review could not be updated.'));
      }

      const data = (await response.json()) as { review?: AdminReview };

      if (!data.review) {
        throw new Error('Review could not be updated.');
      }

      setReviews((currentReviews) => upsertNewest(currentReviews, data.review as AdminReview));
      setMessage({ tone: 'success', text: 'Review updated.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Review could not be updated.'),
      });
    }
  }

  async function deleteReview(reviewId: string) {
    const shouldDelete = window.confirm('Remove this review permanently?');

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Review could not be removed.'));
      }

      setReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId),
      );
      setMessage({ tone: 'success', text: 'Review removed.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Review could not be removed.'),
      });
    }
  }

  async function inviteAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminInvitationsEnabled) {
      setMessage({
        tone: 'info',
        text: 'Admin invitations are paused. Enable invitations before sending a new invite.',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'ADMIN',
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Admin invitation could not be created.'));
      }

      const data = (await response.json()) as { invitation?: AdminInvitation };

      if (!data.invitation) {
        throw new Error('Admin invitation could not be created.');
      }

      setInvitations((currentInvitations) =>
        upsertNewest(currentInvitations, data.invitation as AdminInvitation),
      );
      setInviteEmail('');
      setMessage({
        tone: 'success',
        text: 'Admin invitation recorded. The invite will be accepted automatically when that email signs up with Clerk.',
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Admin invitation could not be created.'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateAdminInvitations(enabled: boolean) {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminInvitationsEnabled: enabled }),
      });
      const data = (await response.json().catch(() => null)) as {
        adminInvitationsEnabled?: boolean;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? 'Invitation access could not be updated.');
      }

      if (typeof data?.adminInvitationsEnabled !== 'boolean') {
        throw new Error('Invitation access could not be updated.');
      }

      setAdminInvitationsEnabled(data.adminInvitationsEnabled);
      setMessage({
        tone: 'success',
        text: data.adminInvitationsEnabled
          ? 'Admin invitations are enabled.'
          : 'Admin invitations are paused. Pending invites will not grant admin access while paused.',
      });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Invitation access could not be updated.'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function cancelInvitation(invitationId: string) {
    const shouldCancel = window.confirm('Cancel this pending admin invitation?');

    if (!shouldCancel) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/invitations?id=${encodeURIComponent(invitationId)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error(await readError(response, 'Invitation could not be cancelled.'));
      }

      setInvitations((currentInvitations) =>
        currentInvitations.filter((invitation) => invitation.id !== invitationId),
      );
      setMessage({ tone: 'success', text: 'Pending admin invitation cancelled.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: parseApiError(error, 'Invitation could not be cancelled.'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7efe2]">
      <div className="border-b border-white/10 bg-[#0d0e10]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-gold/30 bg-gold/10 text-gold" variant="outline">
                <ShieldCheck className="size-3" />
                Private Admin
              </Badge>
              <span className="text-xs uppercase tracking-[0.28em] text-white/40">
                Libasya Control Room
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-white/55">
              Signed in as {admin.name} | {admin.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-10 border-white/10 bg-white/[0.06] text-[#f7efe2] hover:bg-white/[0.1]"
              variant="outline"
              onClick={() => void loadDashboard()}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-[#f7efe2] transition-all hover:bg-white/[0.1]"
              href="/"
            >
              View Store
            </Link>
            <SignOutButton redirectUrl="/admin">
              <Button className="h-10 bg-gold text-charcoal hover:bg-gold/90">
                <LogOut className="size-4" />
                Logout
              </Button>
            </SignOutButton>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className={cn(panelClass, 'p-4')}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/50">{metric.label}</p>
                <metric.icon className="size-5 text-gold" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="mt-1 text-xs text-white/40">{metric.helper}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                'inline-flex h-10 min-w-fit items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-gold bg-gold text-charcoal'
                  : 'border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.09] hover:text-white',
              )}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {message ? (
          <div
            className={cn(
              'mb-5 rounded-lg border px-4 py-3 text-sm font-medium',
              message.tone === 'success' &&
                'border-spruce/40 bg-spruce/20 text-[#d8f5e6]',
              message.tone === 'error' && 'border-oxblood/50 bg-oxblood/20 text-[#ffd5dd]',
              message.tone === 'info' && 'border-gold/40 bg-gold/10 text-gold',
            )}
          >
            {message.text}
          </div>
        ) : null}

        {loading ? (
          <div className={cn(panelClass, 'grid min-h-72 place-items-center p-8')}>
            <div className="text-center">
              <RefreshCw className="mx-auto size-8 animate-spin text-gold" />
              <p className="mt-3 text-sm text-white/55">Loading dashboard data...</p>
            </div>
          </div>
        ) : null}

        {!loading && activeTab === 'Overview' ? (
          <OverviewPanel
            orders={orders}
            reviews={reviews}
            setActiveTab={setActiveTab}
          />
        ) : null}

        {!loading && activeTab === 'Products' ? (
          <ProductsPanel
            filteredProducts={filteredProducts}
            productForm={productForm}
            productPreview={productPreview}
            productSearch={productSearch}
            saving={saving}
            setProductForm={setProductForm}
            setProductSearch={setProductSearch}
            saveProduct={saveProduct}
            onProductImageUploadBegin={handleProductImageUploadBegin}
            onProductImageUploadError={handleProductImageUploadError}
            onProductImageUploaded={handleProductImageUploaded}
            uploadingImage={uploadingImage}
            editProduct={editProduct}
            deleteProduct={deleteProduct}
          />
        ) : null}

        {!loading && activeTab === 'Coupons' ? (
          <CouponsPanel
            couponForm={couponForm}
            coupons={coupons}
            saving={saving}
            setCouponForm={setCouponForm}
            saveCoupon={saveCoupon}
            toggleCoupon={toggleCoupon}
            deleteCoupon={deleteCoupon}
          />
        ) : null}

        {!loading && activeTab === 'Orders' ? (
          <OrdersPanel orders={orders} updateOrderStatus={updateOrderStatus} />
        ) : null}

        {!loading && activeTab === 'Reviews' ? (
          <ReviewsPanel
            deleteReview={deleteReview}
            featuredReviewCount={featuredReviewCount}
            filteredReviews={filteredReviews}
            reviewSearch={reviewSearch}
            setReviewSearch={setReviewSearch}
            updateReview={updateReview}
          />
        ) : null}

        {!loading && activeTab === 'Access' ? (
          <AccessPanel
            adminInvitationsEnabled={adminInvitationsEnabled}
            cancelInvitation={cancelInvitation}
            inviteAdmin={inviteAdmin}
            inviteEmail={inviteEmail}
            invitations={invitations}
            saving={saving}
            setInviteEmail={setInviteEmail}
            updateAdminInvitations={updateAdminInvitations}
          />
        ) : null}

        {!loading && activeTab === 'Content' ? (
          <AdminContentPanel />
        ) : null}
      </div>
    </main>
  );
}

function OverviewPanel({
  orders,
  reviews,
  setActiveTab,
}: {
  orders: AdminOrder[];
  reviews: AdminReview[];
  setActiveTab: (tab: DashboardTab) => void;
}) {
  return (
    <div className="grid gap-5">
      <section className={cn(panelClass, 'p-5')}>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Queue</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Needs Attention</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
            type="button"
            onClick={() => setActiveTab('Orders')}
          >
            <p className="text-sm text-white/55">Pending orders</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {orders.filter((order) => order.status === 'Pending').length}
            </p>
          </button>
          <button
            className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
            type="button"
            onClick={() => setActiveTab('Reviews')}
          >
            <p className="text-sm text-white/55">Hidden reviews</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {reviews.filter((review) => !review.isPublished).length}
            </p>
          </button>
          <button
            className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.08]"
            type="button"
            onClick={() => setActiveTab('Reviews')}
          >
            <p className="text-sm text-white/55">Home page reviews selected</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {reviews.filter((review) => review.featuredOnHome).length}/3
            </p>
          </button>
        </div>
      </section>
    </div>
  );
}

function ReviewsPanel({
  deleteReview,
  featuredReviewCount,
  filteredReviews,
  reviewSearch,
  setReviewSearch,
  updateReview,
}: {
  deleteReview: (reviewId: string) => void;
  featuredReviewCount: number;
  filteredReviews: AdminReview[];
  reviewSearch: string;
  setReviewSearch: (value: string) => void;
  updateReview: (
    reviewId: string,
    patch: Partial<Pick<AdminReview, 'displayOrder' | 'featuredOnHome' | 'isPublished'>>,
  ) => void;
}) {
  return (
    <section className={cn(panelClass, 'overflow-hidden')}>
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Reviews</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Real User Review Control</h2>
          <p className="mt-2 text-sm text-white/50">
            {featuredReviewCount}/3 reviews selected for the home page.
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            className={cn('pl-9', fieldClass)}
            placeholder="Search reviews"
            value={reviewSearch}
            onChange={(event) => setReviewSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-5 py-3 font-medium">Review</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Rating</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Home</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredReviews.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-white/50" colSpan={7}>
                  No reviews found.
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => {
                const homeDisabled = !review.featuredOnHome && featuredReviewCount >= 3;

                return (
                  <tr key={review.id} className="align-top">
                    <td className="px-5 py-4">
                      <p className="line-clamp-3 max-w-md text-white/75">&ldquo;{review.quote}&rdquo;</p>
                      <p className="mt-2 text-xs text-white/35">{formatDate(review.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{review.author}</p>
                      <p className="mt-1 text-xs text-white/45">{review.user?.email ?? 'Synced user unavailable'}</p>
                    </td>
                    <td className="px-5 py-4">
                      {review.product ? (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={review.product.name}
                            className="size-10 rounded object-cover"
                            src={review.product.imageUrl}
                          />
                          <span className="max-w-40 truncate text-white/65">{review.product.name}</span>
                        </div>
                      ) : (
                        <span className="text-white/35">General</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex text-gold">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} className="size-4 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        className={
                          review.isPublished
                            ? 'border-spruce/40 bg-spruce/15 text-[#d8f5e6]'
                            : 'border-white/10 bg-white/[0.05] text-white/45'
                        }
                        variant="outline"
                      >
                        {review.isPublished ? 'visible' : 'hidden'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-white/65">
                        <input
                          checked={review.featuredOnHome}
                          className="size-4 accent-gold"
                          disabled={homeDisabled}
                          type="checkbox"
                          onChange={(event) =>
                            updateReview(review.id, { featuredOnHome: event.target.checked })
                          }
                        />
                        Show
                      </label>
                      {homeDisabled ? (
                        <p className="mt-1 text-xs text-white/35">3 already selected</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() =>
                            updateReview(review.id, { isPublished: !review.isPublished })
                          }
                        >
                          {review.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          {review.isPublished ? 'Hide' : 'Publish'}
                        </Button>
                        <Button
                          className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AccessPanel({
  adminInvitationsEnabled,
  cancelInvitation,
  invitations,
  inviteAdmin,
  inviteEmail,
  saving,
  setInviteEmail,
  updateAdminInvitations,
}: {
  adminInvitationsEnabled: boolean;
  cancelInvitation: (invitationId: string) => void;
  invitations: AdminInvitation[];
  inviteAdmin: (event: FormEvent<HTMLFormElement>) => void;
  inviteEmail: string;
  saving: boolean;
  setInviteEmail: (value: string) => void;
  updateAdminInvitations: (enabled: boolean) => void;
}) {
  const pendingCount = invitations.filter((invite) => invite.status === 'PENDING').length;
  const acceptedCount = invitations.filter((invite) => invite.status === 'ACCEPTED').length;

  return (
    <div className="grid gap-5 xl:grid-cols-[24rem_1fr] xl:items-start">
      <div className="grid gap-5">
        <section className={cn(panelClass, 'p-5')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Gate</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Admin Invitation Control</h2>
            </div>
            <Badge
              className={
                adminInvitationsEnabled
                  ? 'border-spruce/40 bg-spruce/15 text-[#d8f5e6]'
                  : 'border-oxblood/50 bg-oxblood/20 text-[#ffd5dd]'
              }
              variant="outline"
            >
              {adminInvitationsEnabled ? 'Enabled' : 'Paused'}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/55">
            When paused, admins cannot create new invites and pending invites will not promote
            Clerk signups to admin until this gate is enabled again.
          </p>
          <Button
            className={cn(
              'mt-5 h-10 w-full',
              adminInvitationsEnabled
                ? 'border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30'
                : 'bg-spruce text-white hover:bg-spruce/90',
            )}
            disabled={saving}
            type="button"
            variant={adminInvitationsEnabled ? 'outline' : 'default'}
            onClick={() => updateAdminInvitations(!adminInvitationsEnabled)}
          >
            <ShieldCheck className="size-4" />
            {adminInvitationsEnabled ? 'Pause Admin Invitations' : 'Enable Admin Invitations'}
          </Button>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Pending', value: pendingCount },
              { label: 'Accepted', value: acceptedCount },
              { label: 'Total', value: invitations.length },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cn(panelClass, 'p-5')}>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Invite</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Invite Admin</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">
            This creates a pending invitation in Neon. When the invited email signs up with
            Clerk, the sync handler marks the invitation accepted and grants admin access.
          </p>
          <form className="mt-5 grid gap-4" onSubmit={inviteAdmin}>
            <div>
              <label className="text-sm font-medium text-white/75" htmlFor="admin-invite-email">
                Email address
              </label>
              <Input
                id="admin-invite-email"
                className={cn('mt-2', fieldClass)}
                disabled={!adminInvitationsEnabled || saving}
                placeholder="admin@example.com"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                required
              />
            </div>
            <Button
              className="h-10 bg-gold text-charcoal hover:bg-gold/90"
              disabled={!adminInvitationsEnabled || saving}
              type="submit"
            >
              <MailPlus className="size-4" />
              {saving ? 'Inviting...' : 'Invite Admin'}
            </Button>
          </form>
          {!adminInvitationsEnabled ? (
            <div className="mt-5 rounded-lg border border-oxblood/40 bg-oxblood/15 p-3 text-sm text-[#ffd5dd]">
              Invitation creation is paused from this panel and from the API.
            </div>
          ) : null}
        </section>
      </div>

      <section className={cn(panelClass, 'overflow-hidden')}>
        <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Access</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Invitation Ledger</h2>
          </div>
          <Badge className="border-gold/30 bg-gold/10 text-gold" variant="outline">
            {pendingCount} pending
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Invited By</th>
                <th className="px-5 py-3 font-medium">Accepted By</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invitations.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-white/50" colSpan={7}>
                    No invitations yet.
                  </td>
                </tr>
              ) : (
                invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-5 py-4 font-semibold text-white">{invitation.email}</td>
                    <td className="px-5 py-4 text-white/60">{formatRole(invitation.role)}</td>
                    <td className="px-5 py-4">
                      <Badge
                        className={
                          invitation.status === 'ACCEPTED'
                            ? 'border-spruce/40 bg-spruce/15 text-[#d8f5e6]'
                            : 'border-gold/30 bg-gold/10 text-gold'
                        }
                        variant="outline"
                      >
                        {invitation.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-white/60">{invitation.invitedBy.email}</td>
                    <td className="px-5 py-4 text-white/60">
                      {invitation.acceptedBy?.email ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-white/45">{formatDate(invitation.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        {invitation.status === 'PENDING' ? (
                          <Button
                            className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                            disabled={saving}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => cancelInvitation(invitation.id)}
                          >
                            <Trash2 className="size-4" />
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-white/35">Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ProductsPanel({
  deleteProduct,
  editProduct,
  filteredProducts,
  productForm,
  productPreview,
  productSearch,
  saveProduct,
  saving,
  setProductForm,
  setProductSearch,
  onProductImageUploadBegin,
  onProductImageUploadError,
  onProductImageUploaded,
  uploadingImage,
}: {
  deleteProduct: (productId: string) => Promise<boolean>;
  editProduct: (product: AdminProduct) => void;
  filteredProducts: AdminProduct[];
  productForm: ProductForm;
  productPreview: number;
  productSearch: string;
  saveProduct: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  setProductForm: (form: ProductForm) => void;
  setProductSearch: (value: string) => void;
  onProductImageUploadBegin: () => void;
  onProductImageUploadError: (error: Error) => void;
  onProductImageUploaded: (imageUrl: string) => void;
  uploadingImage: boolean;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[24rem_1fr] xl:items-start">
      <section className={cn(panelClass, 'p-5 xl:sticky xl:top-5')}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Catalog</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {productForm.id ? 'Edit Product' : 'Add Product'}
            </h2>
          </div>
          {productForm.id ? (
            <Button
              className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setProductForm(emptyProductForm)}
            >
              New
            </Button>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={saveProduct}>
          <div>
            <label className="text-sm font-medium text-white/75" htmlFor="admin-product-name">
              Name
            </label>
            <Input
              id="admin-product-name"
              className={cn('mt-2', fieldClass)}
              value={productForm.name}
              onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-white/75"
              htmlFor="admin-product-description"
            >
              Description
            </label>
            <textarea
              id="admin-product-description"
              className={textAreaClass}
              value={productForm.description}
              onChange={(event) =>
                setProductForm({ ...productForm, description: event.target.value })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-medium text-white/75"
                htmlFor="admin-product-price"
              >
                Original Price
              </label>
              <Input
                id="admin-product-price"
                className={cn('mt-2', fieldClass)}
                min="1"
                type="number"
                value={productForm.originalPrice}
                onChange={(event) =>
                  setProductForm({ ...productForm, originalPrice: event.target.value })
                }
                required
              />
            </div>
            <div>
              <label
                className="text-sm font-medium text-white/75"
                htmlFor="admin-product-discount"
              >
                Discount %
              </label>
              <Input
                id="admin-product-discount"
                className={cn('mt-2', fieldClass)}
                max="90"
                min="0"
                type="number"
                value={productForm.discount}
                onChange={(event) =>
                  setProductForm({ ...productForm, discount: event.target.value })
                }
              />
            </div>
          </div>
          <div className="rounded-lg border border-gold/20 bg-gold/10 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/60">Customer price</span>
              <span className="font-semibold text-gold">{formatPrice(productPreview)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white/75" htmlFor="admin-product-image">
              Image URL
            </label>
            <div className="mt-2">
              <OurUploadButton
                disabled={uploadingImage}
                onUploadBegin={onProductImageUploadBegin}
                onUploadComplete={onProductImageUploaded}
                onUploadError={onProductImageUploadError}
              />
            </div>
            <Input
              id="admin-product-image"
              className={cn('mt-2', fieldClass)}
              placeholder="/uploads/products/photo.jpg"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })}
              required
            />
            {productForm.imageUrl ? (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Product preview"
                  className="aspect-[4/3] w-full object-cover object-top"
                  src={productForm.imageUrl}
                />
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <div>
              <label
                className="text-sm font-medium text-white/75"
                htmlFor="admin-product-category"
              >
                Category
              </label>
              <select
                id="admin-product-category"
                className={cn('mt-2', selectClass)}
                value={productForm.category}
                onChange={(event) =>
                  setProductForm({ ...productForm, category: event.target.value })
                }
              >
                {productCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white/75" htmlFor="admin-product-stock">
                Stock
              </label>
              <Input
                id="admin-product-stock"
                className={cn('mt-2', fieldClass)}
                min="0"
                type="number"
                value={productForm.stock}
                onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-white/75">
            <input
              checked={productForm.featured}
              className="size-4 accent-gold"
              type="checkbox"
              onChange={(event) =>
                setProductForm({ ...productForm, featured: event.target.checked })
              }
            />
            Feature on storefront
          </label>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="mb-3 text-sm font-semibold text-white">Product Offer</p>
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-white/75" htmlFor="admin-product-offer-code">
                  Promo Code
                </label>
                <Input
                  id="admin-product-offer-code"
                  className={cn('mt-2 uppercase', fieldClass)}
                  placeholder="EID20"
                  value={productForm.offerCode}
                  onChange={(event) =>
                    setProductForm({ ...productForm, offerCode: event.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/75" htmlFor="admin-product-offer-deadline">
                  Offer Deadline
                </label>
                <Input
                  id="admin-product-offer-deadline"
                  className={cn('mt-2', fieldClass)}
                  type="datetime-local"
                  value={productForm.offerEndsAt}
                  onChange={(event) =>
                    setProductForm({ ...productForm, offerEndsAt: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <Button className="h-10 bg-gold text-charcoal hover:bg-gold/90" disabled={saving} type="submit">
            <PackagePlus className="size-4" />
            {saving ? 'Saving...' : productForm.id ? 'Update Product' : 'Add Product'}
          </Button>
          {productForm.id ? (
            <Button
              className="h-10 border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
              disabled={saving}
              type="button"
              variant="outline"
              onClick={async () => {
                const deleted = await deleteProduct(productForm.id);

                if (deleted) {
                  setProductForm(emptyProductForm);
                }
              }}
            >
              <Trash2 className="size-4" />
              Remove Product
            </Button>
          ) : null}
        </form>
      </section>

      <section className={cn(panelClass, 'overflow-hidden')}>
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Inventory</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Product Data Table</h2>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input
              className={cn('pl-9', fieldClass)}
              placeholder="Search products"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Offer</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-white/50" colSpan={6}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const { currentPrice, discount, originalPrice } = getProductPrice(product);

                  return (
                    <tr key={product.id} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={product.name}
                            className="size-16 rounded-md object-cover"
                            src={product.imageUrl}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{product.name}</p>
                            <p className="mt-1 line-clamp-2 max-w-sm text-xs leading-5 text-white/50">
                              {product.description}
                            </p>
                            {product.featured ? (
                              <Badge className="mt-2 bg-spruce text-white">Featured</Badge>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {discount > 0 ? (
                            <span className="line-through text-muted-foreground">
                              {formatPrice(originalPrice)}
                            </span>
                          ) : null}
                          <span className="font-semibold text-gold">{formatPrice(currentPrice)}</span>
                          {discount > 0 ? (
                            <span className="text-xs text-white/45">{discount}% off</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          className={
                            product.stock > 0
                              ? 'border-spruce/40 bg-spruce/15 text-[#d8f5e6]'
                              : 'border-oxblood/50 bg-oxblood/20 text-[#ffd5dd]'
                          }
                          variant="outline"
                        >
                          {product.stock} unit{product.stock === 1 ? '' : 's'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-white/60">{product.category}</td>
                      <td className="px-5 py-4">
                        {product.offerCode || product.offerEndsAt ? (
                          <div className="space-y-1">
                            {product.offerCode ? (
                              <Badge className="border-gold/30 bg-gold/10 text-gold" variant="outline">
                                {product.offerCode}
                              </Badge>
                            ) : null}
                            <p className="text-xs text-white/45">
                              {product.offerEndsAt
                                ? `Ends ${formatDate(product.offerEndsAt)}`
                                : 'No deadline'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-white/35">No offer</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => editProduct(product)}
                          >
                            <Edit3 className="size-4" />
                            Edit
                          </Button>
                          <Button
                            className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => void deleteProduct(product.id)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CouponsPanel({
  couponForm,
  coupons,
  deleteCoupon,
  saveCoupon,
  saving,
  setCouponForm,
  toggleCoupon,
}: {
  couponForm: CouponForm;
  coupons: AdminCoupon[];
  deleteCoupon: (couponId: string) => void;
  saveCoupon: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  setCouponForm: (form: CouponForm) => void;
  toggleCoupon: (coupon: AdminCoupon) => void;
}) {
  function generateCode() {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

    setCouponForm({ ...couponForm, code: `LIBASYA-${suffix}` });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start">
      <section className={cn(panelClass, 'p-5')}>
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Promos</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Generate Coupon</h2>
        <form className="mt-5 grid gap-4" onSubmit={saveCoupon}>
          <div>
            <label className="text-sm font-medium text-white/75" htmlFor="admin-coupon-code">
              Code
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="admin-coupon-code"
                className={cn(fieldClass, 'uppercase')}
                value={couponForm.code}
                onChange={(event) =>
                  setCouponForm({ ...couponForm, code: event.target.value.toUpperCase() })
                }
                required
              />
              <Button
                className="h-10 border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                type="button"
                variant="outline"
                onClick={generateCode}
              >
                Generate
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-white/75" htmlFor="admin-coupon-discount">
                Discount %
              </label>
              <Input
                id="admin-coupon-discount"
                className={cn('mt-2', fieldClass)}
                max="90"
                min="1"
                type="number"
                value={couponForm.discountPercent}
                onChange={(event) =>
                  setCouponForm({ ...couponForm, discountPercent: event.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white/75" htmlFor="admin-coupon-expiry">
                Expiry
              </label>
              <Input
                id="admin-coupon-expiry"
                className={cn('mt-2', fieldClass)}
                type="date"
                value={couponForm.expiryDate}
                onChange={(event) =>
                  setCouponForm({ ...couponForm, expiryDate: event.target.value })
                }
                required
              />
            </div>
          </div>
          <Button className="h-10 bg-gold text-charcoal hover:bg-gold/90" disabled={saving} type="submit">
            <TicketPercent className="size-4" />
            {saving ? 'Saving...' : 'Save Coupon'}
          </Button>
        </form>
      </section>

      <section className={cn(panelClass, 'overflow-hidden')}>
        <div className="border-b border-white/10 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Control</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Active and Paused Codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/45">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {coupons.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-white/50" colSpan={5}>
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-5 py-4 font-semibold text-white">{coupon.code}</td>
                    <td className="px-5 py-4 text-gold">{coupon.discountPercent}%</td>
                    <td className="px-5 py-4 text-white/60">{formatDate(coupon.expiryDate)}</td>
                    <td className="px-5 py-4">
                      <Badge
                        className={
                          coupon.isActive
                            ? 'border-spruce/40 bg-spruce/15 text-[#d8f5e6]'
                            : 'border-white/10 bg-white/[0.05] text-white/45'
                        }
                        variant="outline"
                      >
                        {coupon.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => toggleCoupon(coupon)}
                        >
                          {coupon.isActive ? 'Pause' : 'Activate'}
                        </Button>
                        <Button
                          className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                          size="icon-sm"
                          type="button"
                          variant="outline"
                          onClick={() => deleteCoupon(coupon.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function OrdersPanel({
  orders,
  updateOrderStatus,
}: {
  orders: AdminOrder[];
  updateOrderStatus: (orderId: string, status: AdminOrderStatus) => void;
}) {
  return (
    <section className={cn(panelClass, 'overflow-hidden')}>
      <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Verification</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Order Queue</h2>
        </div>
        <Badge className="border-gold/30 bg-gold/10 text-gold" variant="outline">
          {orders.filter((order) => order.status === 'Pending').length} pending
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-white/45">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Verify</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {orders.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-white/50" colSpan={7}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-white/45">{formatDate(order.createdAt)}</p>
                    {order.couponCode ? (
                      <Badge className="mt-2 border-gold/30 bg-gold/10 text-gold" variant="outline">
                        {order.couponCode} | {order.couponDiscountPercent}%
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">{order.customerName}</p>
                    <p className="mt-1 text-white/60">{order.customerPhone}</p>
                    <p className="mt-2 max-w-xs text-xs leading-5 text-white/45">
                      {order.deliveryAddress}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {order.paymentMethod === 'COD' ? (
                      <Badge className="border-white/10 bg-white/[0.05] text-white/60" variant="outline">
                        Cash on Delivery
                      </Badge>
                    ) : (
                      <div className="grid gap-2">
                        <Badge className="border-gold/30 bg-gold/10 text-gold" variant="outline">
                          {order.paymentGateway}
                        </Badge>
                        <p className="text-xs text-white/50">
                          Sender: <span className="text-white/80">{order.paymentNumber}</span>
                        </p>
                        <p className="text-xs text-white/50">
                          TxnID: <span className="font-semibold text-white">{order.transactionId}</span>
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid gap-2">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={item.product.name}
                            className="size-9 rounded object-cover"
                            src={item.product.imageUrl}
                          />
                          <div>
                            <p className="max-w-48 truncate text-xs font-medium text-white">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-white/45">
                              {item.quantity} x {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gold">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className={selectClass}
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value as AdminOrderStatus)
                      }
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {order.status === 'Pending' ? (
                        <Button
                          className="bg-spruce text-white hover:bg-spruce/90"
                          size="sm"
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'Processing')}
                        >
                          <CheckCircle2 className="size-4" />
                          Paid
                        </Button>
                      ) : null}
                      <Button
                        className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
