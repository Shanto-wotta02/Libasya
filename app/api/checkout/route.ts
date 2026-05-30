import { NextResponse } from 'next/server';

import {
  getProductDisplayPrice,
  normalizePaymentGateway,
  normalizePaymentMethod,
} from '@/lib/commerce';
import prisma from '@/lib/prisma';

type CheckoutItemInput = {
  productId?: unknown;
  quantity?: unknown;
};

function parseText(value: unknown) {
  return String(value ?? '').trim();
}

function parseCheckoutItems(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('Cart items are required.');
  }

  const items = value.map((item: CheckoutItemInput) => ({
    productId: parseText(item.productId),
    quantity: Math.max(1, Math.min(99, Math.round(Number(item.quantity ?? 1)))),
  }));

  if (items.length === 0 || items.some((item) => !item.productId)) {
    throw new Error('Cart items are required.');
  }

  return items;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerName = parseText(body.customerName);
    const customerPhone = parseText(body.customerPhone ?? body.phone);
    const deliveryAddress = parseText(body.deliveryAddress ?? body.address);
    const paymentMethod = normalizePaymentMethod(body.paymentMethod);
    const paymentGateway = normalizePaymentGateway(body.paymentGateway);
    const paymentNumber = parseText(body.paymentNumber ?? body.senderPhone);
    const transactionId = parseText(body.transactionId ?? body.paymentReference);
    const couponCode = parseText(body.couponCode).toUpperCase();
    const items = parseCheckoutItems(body.items);

    if (!customerName || !customerPhone || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Name, phone, and delivery address are required.' },
        { status: 400 },
      );
    }

    if (paymentMethod === 'MANUAL') {
      if (!paymentGateway) {
        return NextResponse.json(
          { error: 'A valid manual payment gateway is required.' },
          { status: 400 },
        );
      }

      if (!paymentNumber || !transactionId) {
        return NextResponse.json(
          { error: 'Sender phone number and transaction ID are required for manual payment.' },
          { status: 400 },
        );
      }
    }

    const products = await prisma.product.findMany({
      where: {
        isArchived: false,
        id: {
          in: items.map((item) => item.productId),
        },
      },
    });

    if (products.length !== new Set(items.map((item) => item.productId)).size) {
      return NextResponse.json(
        { error: 'One or more cart products are no longer available.' },
        { status: 400 },
      );
    }

    const orderItems = items.map((item) => {
      const product = products.find((nextProduct) => nextProduct.id === item.productId);

      if (!product) {
        throw new Error('One or more cart products are no longer available.');
      }

      if (product.stock < item.quantity) {
        throw new Error(`${product.name} has only ${product.stock} unit(s) left.`);
      }

      const pricing = getProductDisplayPrice(product);
      const lineTotal = pricing.currentPrice * item.quantity;

      return {
        product,
        quantity: item.quantity,
        unitPrice: pricing.currentPrice,
        lineTotal,
      };
    });

    const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0);
    let couponDiscountPercent = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon || !coupon.isActive || coupon.expiryDate.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Coupon is invalid or expired.' }, { status: 400 });
      }

      couponDiscountPercent = coupon.discountPercent;
    }

    const totalAmount = Math.max(
      0,
      Math.round(subtotal * ((100 - couponDiscountPercent) / 100)),
    );

    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return tx.order.create({
        data: {
          customerName,
          phone: customerPhone,
          address: deliveryAddress,
          customerPhone,
          deliveryAddress,
          paymentMethod,
          paymentGateway: paymentMethod === 'MANUAL' ? paymentGateway : null,
          paymentNumber: paymentMethod === 'MANUAL' ? paymentNumber : null,
          transactionId: paymentMethod === 'MANUAL' ? transactionId : null,
          couponCode: couponCode || null,
          couponDiscountPercent,
          subtotal: Math.round(subtotal),
          totalAmount,
          status: 'Pending',
          orderItems: {
            create: orderItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to place order.' },
      { status: 400 },
    );
  }
}
