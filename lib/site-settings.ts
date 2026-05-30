import 'server-only';

import prisma from '@/lib/prisma';

const twelveHours = 1000 * 60 * 60 * 12;

export type SerializedSiteSettings = {
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
  heroStatOneValue: string;
  heroStatOneLabel: string;
  heroStatTwoValue: string;
  heroStatTwoLabel: string;
  heroStatThreeValue: string;
  heroStatThreeLabel: string;
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
  adminInvitationsEnabled: boolean;
  updatedAt: string;
};

export function defaultOfferEndsAt() {
  return new Date(Date.now() + twelveHours);
}

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 'main' },
  });

  if (settings) {
    return settings;
  }

  return prisma.siteSettings.create({
    data: {
      id: 'main',
      offerEndsAt: defaultOfferEndsAt(),
    },
  });
}

export function serializeSiteSettings(
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
): SerializedSiteSettings {
  return {
    id: settings.id,
    brandName: settings.brandName,
    brandTagline: settings.brandTagline,
    heroBadge: settings.heroBadge,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    heroImageUrl: settings.heroImageUrl,
    heroCardTitle: settings.heroCardTitle,
    heroCardSubtitle: settings.heroCardSubtitle,
    heroProductSubtitle: settings.heroProductSubtitle,
    heroRibbonText: settings.heroRibbonText,
    heroPrimaryCta: settings.heroPrimaryCta,
    heroSecondaryCta: settings.heroSecondaryCta,
    heroStatOneValue: settings.heroStatOneValue,
    heroStatOneLabel: settings.heroStatOneLabel,
    heroStatTwoValue: settings.heroStatTwoValue,
    heroStatTwoLabel: settings.heroStatTwoLabel,
    heroStatThreeValue: settings.heroStatThreeValue,
    heroStatThreeLabel: settings.heroStatThreeLabel,
    announcementText: settings.announcementText,
    shopEyebrow: settings.shopEyebrow,
    shopTitle: settings.shopTitle,
    shopDescription: settings.shopDescription,
    trustOneLabel: settings.trustOneLabel,
    trustOneText: settings.trustOneText,
    trustTwoLabel: settings.trustTwoLabel,
    trustTwoText: settings.trustTwoText,
    trustThreeLabel: settings.trustThreeLabel,
    trustThreeText: settings.trustThreeText,
    offerTitle: settings.offerTitle,
    offerSubtitle: settings.offerSubtitle,
    offerCode: settings.offerCode,
    offerButtonLabel: settings.offerButtonLabel,
    offerEndsAt: settings.offerEndsAt?.toISOString() ?? null,
    footerDescription: settings.footerDescription,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    paymentBkashNumber: settings.paymentBkashNumber,
    paymentNagadNumber: settings.paymentNagadNumber,
    paymentRocketNumber: settings.paymentRocketNumber,
    adminInvitationsEnabled: settings.adminInvitationsEnabled,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
