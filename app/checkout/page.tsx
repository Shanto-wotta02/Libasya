'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isManualPaymentWalletAvailable, manualPaymentWallets } from '@/lib/commerce';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';

type CouponInfo = {
  code: string;
  discountPercent: number;
};

const paymentMethods = [
  { id: 'COD', label: 'Cash on Delivery', note: 'Pay in cash when your order arrives.' },
  { id: 'MANUAL', label: 'Mobile Payment', note: 'Send to the shop wallet, then submit sender number and TxnID.' },
] as const;

const paymentGateways = [
  { id: 'BKASH', label: 'bKash' },
  { id: 'NAGAD', label: 'Nagad' },
  { id: 'ROCKET', label: 'Rocket' },
] as const;

function calculateSalePrice(product: {
  originalPrice?: number;
  discount?: number;
  discountPercent?: number;
  currentPrice?: number;
  price?: number;
}): number {
  if (product.currentPrice && product.currentPrice > 0) {
    return product.currentPrice;
  }
  const original = product.originalPrice ?? product.price ?? 0;
  const discount = product.discount ?? product.discountPercent ?? 0;
  return Math.round(original * (100 - discount) / 100);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

export default function CheckoutPage() {
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MANUAL'>('COD');
  const [paymentGateway, setPaymentGateway] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [submittedTotal, setSubmittedTotal] = useState(0);
  const [wallets, setWallets] = useState(manualPaymentWallets);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + calculateSalePrice(item.product) * item.quantity, 0);
  }, [cartItems]);

  const couponDiscount = appliedCoupon ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const total = Math.max(0, subtotal - couponDiscount);
  const paymentGatewayOptions = paymentGateways.map((gateway) => ({
    ...gateway,
    ...wallets[gateway.id],
    available: isManualPaymentWalletAvailable(wallets[gateway.id].number),
  }));
  const firstAvailableGateway = paymentGatewayOptions.find((gateway) => gateway.available);
  const activePaymentGateway =
    paymentGatewayOptions.find((gateway) => gateway.id === paymentGateway && gateway.available)
      ?.id ??
    firstAvailableGateway?.id ??
    paymentGateway;
  const hasAvailableManualGateway = Boolean(firstAvailableGateway);
  const activePaymentMethod =
    paymentMethod === 'MANUAL' && !hasAvailableManualGateway ? 'COD' : paymentMethod;

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const response = await fetch('/api/site-settings', { cache: 'no-store' });

      if (!response.ok || !mounted) {
        return;
      }

      const data = (await response.json()) as {
        settings?: {
          paymentBkashNumber?: string;
          paymentNagadNumber?: string;
          paymentRocketNumber?: string;
        };
      };

      if (!mounted) {
        return;
      }

      setWallets({
        BKASH: {
          label: 'bKash',
          number: data.settings?.paymentBkashNumber || manualPaymentWallets.BKASH.number,
        },
        NAGAD: {
          label: 'Nagad',
          number: data.settings?.paymentNagadNumber || manualPaymentWallets.NAGAD.number,
        },
        ROCKET: {
          label: 'Rocket',
          number: data.settings?.paymentRocketNumber || manualPaymentWallets.ROCKET.number,
        },
      });
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponMessage('');

    try {
      const response = await fetch('/api/checkout/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });

      const data = await response.json();

      if (!response.ok || !data.coupon) {
        throw new Error(data.error ?? 'Coupon could not be applied.');
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discountPercent: data.coupon.discountPercent,
      });
      setCouponMessage(`${data.coupon.discountPercent}% coupon applied successfully.`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err instanceof Error ? err.message : 'Coupon could not be applied.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const customerName = formData.get('customerName') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if (!customerName || !phone || !address) {
      setError('Please fill in all customer details.');
      setSubmitting(false);
      return;
    }

    if (activePaymentMethod === 'MANUAL') {
      const senderPhone = formData.get('paymentNumber') as string;
      const txnId = formData.get('transactionId') as string;
      if (!senderPhone || !txnId) {
        setError('Sender phone and transaction ID are required for manual payment.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          paymentMethod: activePaymentMethod,
          paymentGateway: activePaymentMethod === 'MANUAL' ? activePaymentGateway : null,
          paymentNumber: activePaymentMethod === 'MANUAL' ? (formData.get('paymentNumber') as string) : null,
          transactionId: activePaymentMethod === 'MANUAL' ? (formData.get('transactionId') as string) : null,
          couponCode: appliedCoupon?.code ?? '',
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.order) {
        throw new Error(data.error ?? 'Order submission failed.');
      }

      setSubmittedTotal(data.order.totalAmount);
      setSuccess(true);
      setOrderReference(data.order.id);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#08090a] text-[#f7efe2] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#08090a] text-[#f7efe2] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-spruce/30 bg-spruce/15 p-8 max-w-md w-full text-center">
          <CheckCircle2 className="size-12 text-spruce mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Order Placed Successfully!</h2>
          <p className="text-white/70 mb-4">
            Your order <span className="font-bold text-gold">#{orderReference.slice(-8).toUpperCase()}</span> has been received.
          </p>
          <p className="text-sm text-white/60 mb-6">
            Total: <span className="font-bold text-gold">{formatPrice(submittedTotal)}</span>
          </p>
          <Link
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-2.5 text-sm font-medium text-charcoal transition-all hover:bg-gold/90"
            href="/"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#08090a] text-[#f7efe2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Your cart is empty.</p>
          <Link href="/shop" className="mt-4 inline-block text-gold hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7efe2]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
          <ArrowLeft className="size-4" />
          Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/70 mb-1 block">Full Name</label>
                    <Input name="customerName" required className="h-11 bg-[#15110d] border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70 mb-1 block">Phone Number</label>
                    <Input name="phone" type="tel" required className="h-11 bg-[#15110d] border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70 mb-1 block">Delivery Address</label>
                    <Input name="address" required className="h-11 bg-[#15110d] border-white/10 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const methodDisabled = method.id === 'MANUAL' && !hasAvailableManualGateway;

                    return (
                      <label
                        key={method.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border bg-[#15110d] border-white/10',
                          methodDisabled ? 'cursor-not-allowed opacity-45 grayscale' : 'cursor-pointer',
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={activePaymentMethod === method.id}
                          disabled={methodDisabled}
                          onChange={() => {
                            if (!methodDisabled) {
                              setPaymentMethod(method.id as 'COD' | 'MANUAL');
                            }
                          }}
                          className="mt-1 accent-gold disabled:cursor-not-allowed"
                        />
                        <div>
                          <p className={cn('font-medium', methodDisabled ? 'text-white/35' : null)}>
                            {method.label}
                          </p>
                          <p className={cn('text-sm', methodDisabled ? 'text-white/30' : 'text-white/50')}>
                            {methodDisabled ? 'Currently unavailable.' : method.note}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {activePaymentMethod === 'MANUAL' && (
                <div className="space-y-4 rounded-lg border bg-[#15110d] border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-white/70">Select Gateway</h3>
                  <div className="grid gap-2">
                    {paymentGatewayOptions.map((gw) => (
                      <label
                        key={gw.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded border border-white/10 bg-[#0d0e10]',
                          gw.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-45 grayscale',
                        )}
                      >
                        <span className={cn(gw.available ? null : 'text-white/35')}>{gw.label}</span>
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              gw.available ? 'text-gold' : 'text-white/30',
                            )}
                          >
                            {gw.available ? gw.number : 'Unavailable'}
                          </span>
                          <input
                            type="radio"
                            name="paymentGateway"
                            value={gw.id}
                            checked={activePaymentGateway === gw.id}
                            disabled={!gw.available}
                            onChange={() => {
                              if (gw.available) {
                                setPaymentGateway(gw.id);
                              }
                            }}
                            className="accent-gold disabled:cursor-not-allowed"
                          />
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="bg-charcoal rounded-lg p-3 text-center">
                    <p className="text-sm text-white/60">Send to:</p>
                    <p className="text-xl font-bold text-gold">
                      {wallets[activePaymentGateway].number}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/70 mb-1 block">Sender Phone Number</label>
                    <Input name="paymentNumber" type="tel" required className="h-11 bg-[#15110d] border-white/10 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/70 mb-1 block">Transaction ID (TxnID)</label>
                    <Input name="transactionId" required className="h-11 bg-[#15110d] border-white/10 text-white" />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-oxblood text-sm font-medium">{error}</p>
              )}

              <Button
                type="submit"
                disabled={
                  submitting ||
                  cartItems.length === 0 ||
                  (activePaymentMethod === 'MANUAL' && !hasAvailableManualGateway)
                }
                className="w-full h-12 bg-gold text-charcoal hover:bg-gold/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  `Place Order - ${formatPrice(total)}`
                )}
              </Button>
            </form>
          </div>

          <div>
            <div className="bg-[#15110d] rounded-lg border border-white/10 p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {cartItems.map((item) => {
                  const salePrice = calculateSalePrice(item.product);
                  const originalPrice = item.product.originalPrice ?? item.product.price ?? 0;
                  const discount = item.product.discount ?? item.product.discountPercent ?? 0;

                  return (
                    <div key={item.product.id} className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="size-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-white/50">Qty: {item.quantity}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {discount > 0 && (
                            <span className="text-sm text-white/50 line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                          <span className="font-bold text-gold">{formatPrice(salePrice)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-spruce">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2">
                  <span>Total</span>
                  <span className="text-gold">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-white/70 mb-2 block">Apply Coupon</label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 h-10 bg-[#15110d] border-white/10 text-white"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode}
                    variant="outline"
                    className="h-10 border-white/10"
                  >
                    {applyingCoupon ? 'Checking...' : 'Apply'}
                  </Button>
                </div>
                {couponMessage && (
                  <p className={cn('text-xs mt-2', appliedCoupon ? 'text-spruce' : 'text-oxblood')}>
                    {couponMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
