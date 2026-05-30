import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import {
  defaultOfferEndsAt,
  getSiteSettings,
  serializeSiteSettings,
} from '@/lib/site-settings';

function parseText(value: unknown, fallback: string) {
  const parsed = String(value ?? '').trim();

  return parsed || fallback;
}

function parseOfferEndsAt(value: unknown) {
  if (!value) {
    return defaultOfferEndsAt();
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Offer end date and time is invalid.');
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const settings = await getSiteSettings();

  return NextResponse.json({ settings: serializeSiteSettings(settings) });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const currentSettings = await getSiteSettings();

    const settings = await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        brandName: parseText(body.brandName, currentSettings.brandName),
        brandTagline: parseText(body.brandTagline, currentSettings.brandTagline),
        heroBadge: parseText(body.heroBadge, currentSettings.heroBadge),
        heroTitle: parseText(body.heroTitle, currentSettings.heroTitle),
        heroSubtitle: parseText(body.heroSubtitle, currentSettings.heroSubtitle),
        heroImageUrl: parseText(body.heroImageUrl, currentSettings.heroImageUrl),
        heroCardTitle: parseText(body.heroCardTitle, currentSettings.heroCardTitle),
        heroCardSubtitle: parseText(body.heroCardSubtitle, currentSettings.heroCardSubtitle),
        heroProductSubtitle: parseText(body.heroProductSubtitle, currentSettings.heroProductSubtitle),
        heroRibbonText: parseText(body.heroRibbonText, currentSettings.heroRibbonText),
        heroPrimaryCta: parseText(body.heroPrimaryCta, currentSettings.heroPrimaryCta),
        heroSecondaryCta: parseText(body.heroSecondaryCta, currentSettings.heroSecondaryCta),
        heroStatOneValue: parseText(body.heroStatOneValue, currentSettings.heroStatOneValue),
        heroStatOneLabel: parseText(body.heroStatOneLabel, currentSettings.heroStatOneLabel),
        heroStatTwoValue: parseText(body.heroStatTwoValue, currentSettings.heroStatTwoValue),
        heroStatTwoLabel: parseText(body.heroStatTwoLabel, currentSettings.heroStatTwoLabel),
        heroStatThreeValue: parseText(body.heroStatThreeValue, currentSettings.heroStatThreeValue),
        heroStatThreeLabel: parseText(body.heroStatThreeLabel, currentSettings.heroStatThreeLabel),
        announcementText: parseText(body.announcementText, currentSettings.announcementText),
        shopEyebrow: parseText(body.shopEyebrow, currentSettings.shopEyebrow),
        shopTitle: parseText(body.shopTitle, currentSettings.shopTitle),
        shopDescription: parseText(body.shopDescription, currentSettings.shopDescription),
        trustOneLabel: parseText(body.trustOneLabel, currentSettings.trustOneLabel),
        trustOneText: parseText(body.trustOneText, currentSettings.trustOneText),
        trustTwoLabel: parseText(body.trustTwoLabel, currentSettings.trustTwoLabel),
        trustTwoText: parseText(body.trustTwoText, currentSettings.trustTwoText),
        trustThreeLabel: parseText(body.trustThreeLabel, currentSettings.trustThreeLabel),
        trustThreeText: parseText(body.trustThreeText, currentSettings.trustThreeText),
        offerTitle: parseText(body.offerTitle, currentSettings.offerTitle),
        offerSubtitle: parseText(body.offerSubtitle, currentSettings.offerSubtitle),
        offerCode: parseText(body.offerCode, currentSettings.offerCode),
        offerButtonLabel: parseText(body.offerButtonLabel, currentSettings.offerButtonLabel),
        offerEndsAt: parseOfferEndsAt(body.offerEndsAt),
        footerDescription: parseText(body.footerDescription, currentSettings.footerDescription),
        contactEmail: parseText(body.contactEmail, currentSettings.contactEmail),
        contactPhone: parseText(body.contactPhone, currentSettings.contactPhone),
        paymentBkashNumber: parseText(body.paymentBkashNumber, currentSettings.paymentBkashNumber),
        paymentNagadNumber: parseText(body.paymentNagadNumber, currentSettings.paymentNagadNumber),
        paymentRocketNumber: parseText(body.paymentRocketNumber, currentSettings.paymentRocketNumber),
        adminInvitationsEnabled:
          body.adminInvitationsEnabled === undefined
            ? currentSettings.adminInvitationsEnabled
            : Boolean(body.adminInvitationsEnabled),
      },
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/best-sellers');
    revalidatePath('/new-arrivals');
    revalidatePath('/offers');
    revalidatePath('/weekend-offers');

    return NextResponse.json({ settings: serializeSiteSettings(settings) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save settings.' },
      { status: 400 },
    );
  }
}
