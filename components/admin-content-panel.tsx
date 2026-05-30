'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SettingsForm = {
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
  offerEndsAt: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  paymentBkashNumber: string;
  paymentNagadNumber: string;
  paymentRocketNumber: string;
};

type EditableSection = {
  title: string;
  body: string;
  tone?: 'dark' | 'light';
};

type EditablePage = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  sections: EditableSection[];
};

type Message = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

const emptySettings: SettingsForm = {
  brandName: 'Libasya',
  brandTagline: 'Premium Punjabi',
  heroBadge: 'Weekend Drop Live',
  heroTitle: 'Libasya',
  heroSubtitle:
    'Premium Punjabi wear for Eid, weddings, Jummah, and everyday confidence. Shop polished ready-to-wear pieces with fast delivery.',
  heroImageUrl:
    'https://images.pexels.com/photos/36412149/pexels-photo-36412149.jpeg?auto=compress&cs=tinysrgb&w=2400',
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
  offerEndsAt: '',
  footerDescription:
    'Premium Punjabi wear made to sell fast, ship fast, and feel refined.',
  contactEmail: 'support@libasya.com',
  contactPhone: '01700-000000',
  paymentBkashNumber: '01700-000000',
  paymentNagadNumber: '01800-000000',
  paymentRocketNumber: '01900-000000',
};

const panelClass =
  'rounded-lg border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur-xl';
const fieldClass =
  'h-10 border-white/10 bg-white/[0.08] text-[#f7efe2] placeholder:text-white/35 focus-visible:ring-gold/45';
const textAreaClass =
  'mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-sm text-[#f7efe2] outline-none placeholder:text-white/35 focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/30';
const selectClass =
  'h-10 w-full rounded-lg border border-white/10 bg-[#15110d] px-3 pr-9 text-sm text-[#f7efe2] outline-none focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/30';

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 16);
}

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  return data?.error ?? fallback;
}

function fieldLabel(id: string, label: string) {
  return (
    <label className="text-sm font-medium text-white/75" htmlFor={id}>
      {label}
    </label>
  );
}

export function AdminContentPanel() {
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(emptySettings);
  const [pages, setPages] = useState<EditablePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('shop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? pages[0],
    [pages, selectedPageId],
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const [settingsResponse, contentResponse] = await Promise.all([
        fetch('/api/admin/settings', { cache: 'no-store' }),
        fetch('/api/admin/content', { cache: 'no-store' }),
      ]);

      if (settingsResponse.status === 401 || contentResponse.status === 401) {
        window.location.href = '/admin';
        return;
      }

      if (!settingsResponse.ok || !contentResponse.ok) {
        throw new Error('Website content could not be loaded.');
      }

      const [settingsData, contentData] = (await Promise.all([
        settingsResponse.json(),
        contentResponse.json(),
      ])) as [
        { settings: Omit<SettingsForm, 'offerEndsAt'> & { offerEndsAt: string | null } },
        { pages: EditablePage[] },
      ];

      setSettingsForm({
        brandName: settingsData.settings.brandName,
        brandTagline: settingsData.settings.brandTagline,
        heroBadge: settingsData.settings.heroBadge,
        heroTitle: settingsData.settings.heroTitle,
        heroSubtitle: settingsData.settings.heroSubtitle,
        heroImageUrl: settingsData.settings.heroImageUrl,
        heroCardTitle: settingsData.settings.heroCardTitle,
        heroCardSubtitle: settingsData.settings.heroCardSubtitle,
        heroProductSubtitle: settingsData.settings.heroProductSubtitle,
        heroRibbonText: settingsData.settings.heroRibbonText,
        heroPrimaryCta: settingsData.settings.heroPrimaryCta,
        heroSecondaryCta: settingsData.settings.heroSecondaryCta,
        announcementText: settingsData.settings.announcementText,
        shopEyebrow: settingsData.settings.shopEyebrow,
        shopTitle: settingsData.settings.shopTitle,
        shopDescription: settingsData.settings.shopDescription,
        trustOneLabel: settingsData.settings.trustOneLabel,
        trustOneText: settingsData.settings.trustOneText,
        trustTwoLabel: settingsData.settings.trustTwoLabel,
        trustTwoText: settingsData.settings.trustTwoText,
        trustThreeLabel: settingsData.settings.trustThreeLabel,
        trustThreeText: settingsData.settings.trustThreeText,
        offerTitle: settingsData.settings.offerTitle,
        offerSubtitle: settingsData.settings.offerSubtitle,
        offerCode: settingsData.settings.offerCode,
        offerButtonLabel: settingsData.settings.offerButtonLabel,
        offerEndsAt: toDateTimeLocal(settingsData.settings.offerEndsAt),
        footerDescription: settingsData.settings.footerDescription,
        contactEmail: settingsData.settings.contactEmail,
        contactPhone: settingsData.settings.contactPhone,
        paymentBkashNumber: settingsData.settings.paymentBkashNumber,
        paymentNagadNumber: settingsData.settings.paymentNagadNumber,
        paymentRocketNumber: settingsData.settings.paymentRocketNumber,
      });
      setPages(contentData.pages);
      setSelectedPageId(contentData.pages[0]?.id ?? 'shop');
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Website content could not be loaded.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadContent();
    }, 0);

    return () => window.clearTimeout(task);
  }, [loadContent]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsForm,
          offerEndsAt: settingsForm.offerEndsAt
            ? new Date(settingsForm.offerEndsAt).toISOString()
            : '',
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Storefront settings could not be saved.'));
      }

      setMessage({ tone: 'success', text: 'Storefront settings saved.' });
      await loadContent();
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Storefront settings could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function savePage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPage) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'page', page: selectedPage }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, 'Page content could not be saved.'));
      }

      setMessage({ tone: 'success', text: `${selectedPage.title} saved.` });
      await loadContent();
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Page content could not be saved.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadHeroImage(file: File) {
    setUploadingHeroImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? 'Hero image could not be uploaded.');
      }

      setSettingsForm((currentSettings) => ({
        ...currentSettings,
        heroImageUrl: data.url ?? currentSettings.heroImageUrl,
      }));
      setMessage({ tone: 'success', text: 'Hero image uploaded. Save settings to publish it.' });
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Hero image could not be uploaded.',
      });
    } finally {
      setUploadingHeroImage(false);
    }
  }

  function updateSelectedPage(patch: Partial<EditablePage>) {
    if (!selectedPage) {
      return;
    }

    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === selectedPage.id ? { ...page, ...patch } : page,
      ),
    );
  }

  function updateSection(index: number, patch: Partial<EditableSection>) {
    if (!selectedPage) {
      return;
    }

    updateSelectedPage({
      sections: selectedPage.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...patch } : section,
      ),
    });
  }

  function addSection() {
    if (!selectedPage) {
      return;
    }

    updateSelectedPage({
      sections: [
        ...selectedPage.sections,
        {
          title: 'New section',
          body: 'Write this section content.',
          tone: 'light',
        },
      ],
    });
  }

  function removeSection(index: number) {
    if (!selectedPage) {
      return;
    }

    updateSelectedPage({
      sections: selectedPage.sections.filter((_, sectionIndex) => sectionIndex !== index),
    });
  }

  if (loading) {
    return (
      <div className={cn(panelClass, 'grid min-h-72 place-items-center p-8')}>
        <div className="text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-gold" />
          <p className="mt-3 text-sm text-white/55">Loading website content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Website Editor</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Launch Content Control</h2>
        </div>
        <Button
          className="h-10 border-white/10 bg-white/[0.06] text-[#f7efe2] hover:bg-white/[0.1]"
          type="button"
          variant="outline"
          onClick={() => void loadContent()}
        >
          <RefreshCw className="size-4" />
          Refresh Content
        </Button>
      </div>

      {message ? (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-sm font-medium',
            message.tone === 'success' && 'border-spruce/40 bg-spruce/20 text-[#d8f5e6]',
            message.tone === 'error' && 'border-oxblood/50 bg-oxblood/20 text-[#ffd5dd]',
            message.tone === 'info' && 'border-gold/40 bg-gold/10 text-gold',
          )}
        >
          {message.text}
        </div>
      ) : null}

      <form className={cn(panelClass, 'grid gap-5 p-5')} onSubmit={saveSettings}>
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-gold" />
          <h3 className="text-lg font-semibold text-white">Home, Checkout, and Global Text</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TextField id="brand-name" label="Brand Name" value={settingsForm.brandName} onChange={(brandName) => setSettingsForm({ ...settingsForm, brandName })} />
          <TextField id="brand-tagline" label="Brand Tagline" value={settingsForm.brandTagline} onChange={(brandTagline) => setSettingsForm({ ...settingsForm, brandTagline })} />
          <TextField id="hero-badge" label="Hero Badge" value={settingsForm.heroBadge} onChange={(heroBadge) => setSettingsForm({ ...settingsForm, heroBadge })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField id="hero-title" label="Hero Title" value={settingsForm.heroTitle} onChange={(heroTitle) => setSettingsForm({ ...settingsForm, heroTitle })} />
          <div>
            {fieldLabel('hero-image', 'Hero Image')}
            <label
              className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gold/35 bg-gold/10 px-3 py-4 text-sm font-semibold text-gold transition-colors hover:bg-gold/15"
              htmlFor="hero-image-upload"
            >
              <Upload className="size-4" />
              {uploadingHeroImage ? 'Uploading image...' : 'Upload from device'}
            </label>
            <input
              id="hero-image-upload"
              accept="image/*"
              className="sr-only"
              disabled={uploadingHeroImage}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void uploadHeroImage(file);
                }

                event.target.value = '';
              }}
            />
            <Input
              id="hero-image"
              className={cn('mt-2', fieldClass)}
              value={settingsForm.heroImageUrl}
              onChange={(event) => setSettingsForm({ ...settingsForm, heroImageUrl: event.target.value })}
            />
          </div>
          <TextareaField id="hero-subtitle" label="Hero Subtitle" value={settingsForm.heroSubtitle} onChange={(heroSubtitle) => setSettingsForm({ ...settingsForm, heroSubtitle })} />
          <TextareaField id="announcement" label="Announcement Bar" value={settingsForm.announcementText} onChange={(announcementText) => setSettingsForm({ ...settingsForm, announcementText })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <TextField id="hero-card-title" label="Image Badge Title" value={settingsForm.heroCardTitle} onChange={(heroCardTitle) => setSettingsForm({ ...settingsForm, heroCardTitle })} />
          <TextField id="hero-card-subtitle" label="Image Badge Subtitle" value={settingsForm.heroCardSubtitle} onChange={(heroCardSubtitle) => setSettingsForm({ ...settingsForm, heroCardSubtitle })} />
          <TextField id="hero-product-subtitle" label="Image Product Subtitle" value={settingsForm.heroProductSubtitle} onChange={(heroProductSubtitle) => setSettingsForm({ ...settingsForm, heroProductSubtitle })} />
          <TextField id="hero-ribbon-text" label="Image Bottom Ribbon" value={settingsForm.heroRibbonText} onChange={(heroRibbonText) => setSettingsForm({ ...settingsForm, heroRibbonText })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TextField id="hero-primary" label="Primary CTA" value={settingsForm.heroPrimaryCta} onChange={(heroPrimaryCta) => setSettingsForm({ ...settingsForm, heroPrimaryCta })} />
          <TextField id="hero-secondary" label="Secondary CTA" value={settingsForm.heroSecondaryCta} onChange={(heroSecondaryCta) => setSettingsForm({ ...settingsForm, heroSecondaryCta })} />
          <TextField id="offer-button" label="Offer Button" value={settingsForm.offerButtonLabel} onChange={(offerButtonLabel) => setSettingsForm({ ...settingsForm, offerButtonLabel })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField id="shop-eyebrow" label="Shop Section Eyebrow" value={settingsForm.shopEyebrow} onChange={(shopEyebrow) => setSettingsForm({ ...settingsForm, shopEyebrow })} />
          <TextField id="shop-title" label="Shop Section Title" value={settingsForm.shopTitle} onChange={(shopTitle) => setSettingsForm({ ...settingsForm, shopTitle })} />
          <TextareaField id="shop-description" label="Shop Section Description" value={settingsForm.shopDescription} onChange={(shopDescription) => setSettingsForm({ ...settingsForm, shopDescription })} />
          <TextareaField id="footer-description" label="Footer Description" value={settingsForm.footerDescription} onChange={(footerDescription) => setSettingsForm({ ...settingsForm, footerDescription })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TextField id="trust-one-label" label="Trust 1 Label" value={settingsForm.trustOneLabel} onChange={(trustOneLabel) => setSettingsForm({ ...settingsForm, trustOneLabel })} />
          <TextField id="trust-two-label" label="Trust 2 Label" value={settingsForm.trustTwoLabel} onChange={(trustTwoLabel) => setSettingsForm({ ...settingsForm, trustTwoLabel })} />
          <TextField id="trust-three-label" label="Trust 3 Label" value={settingsForm.trustThreeLabel} onChange={(trustThreeLabel) => setSettingsForm({ ...settingsForm, trustThreeLabel })} />
          <TextField id="trust-one-text" label="Trust 1 Text" value={settingsForm.trustOneText} onChange={(trustOneText) => setSettingsForm({ ...settingsForm, trustOneText })} />
          <TextField id="trust-two-text" label="Trust 2 Text" value={settingsForm.trustTwoText} onChange={(trustTwoText) => setSettingsForm({ ...settingsForm, trustTwoText })} />
          <TextField id="trust-three-text" label="Trust 3 Text" value={settingsForm.trustThreeText} onChange={(trustThreeText) => setSettingsForm({ ...settingsForm, trustThreeText })} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField id="offer-title" label="Offer Title" value={settingsForm.offerTitle} onChange={(offerTitle) => setSettingsForm({ ...settingsForm, offerTitle })} />
          <TextField id="offer-code" label="Offer Code" value={settingsForm.offerCode} onChange={(offerCode) => setSettingsForm({ ...settingsForm, offerCode })} />
          <TextareaField id="offer-subtitle" label="Offer Subtitle" value={settingsForm.offerSubtitle} onChange={(offerSubtitle) => setSettingsForm({ ...settingsForm, offerSubtitle })} />
          <div>
            {fieldLabel('offer-ends-at', 'Offer Ends At')}
            <Input
              id="offer-ends-at"
              className={cn('mt-2', fieldClass)}
              type="datetime-local"
              value={settingsForm.offerEndsAt}
              onChange={(event) => setSettingsForm({ ...settingsForm, offerEndsAt: event.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <TextField id="contact-phone" label="Contact Phone" value={settingsForm.contactPhone} onChange={(contactPhone) => setSettingsForm({ ...settingsForm, contactPhone })} />
          <TextField id="contact-email" label="Contact Email" value={settingsForm.contactEmail} onChange={(contactEmail) => setSettingsForm({ ...settingsForm, contactEmail })} />
          <TextField id="bkash-number" label="bKash Number" value={settingsForm.paymentBkashNumber} onChange={(paymentBkashNumber) => setSettingsForm({ ...settingsForm, paymentBkashNumber })} />
          <TextField id="nagad-number" label="Nagad Number" value={settingsForm.paymentNagadNumber} onChange={(paymentNagadNumber) => setSettingsForm({ ...settingsForm, paymentNagadNumber })} />
          <TextField id="rocket-number" label="Rocket Number" value={settingsForm.paymentRocketNumber} onChange={(paymentRocketNumber) => setSettingsForm({ ...settingsForm, paymentRocketNumber })} />
        </div>

        <Button className="h-10 w-fit bg-gold text-charcoal hover:bg-gold/90" disabled={saving} type="submit">
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Global Settings'}
        </Button>
      </form>

      <form className={cn(panelClass, 'grid gap-5 p-5')} onSubmit={savePage}>
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div>
            {fieldLabel('page-select', 'Editable Page')}
            <select
              id="page-select"
              className={cn('mt-2', selectClass)}
              value={selectedPage?.id ?? selectedPageId}
              onChange={(event) => setSelectedPageId(event.target.value)}
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  /{page.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Page Copy</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{selectedPage?.title}</h3>
          </div>
        </div>

        {selectedPage ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <TextField id="page-eyebrow" label="Page Eyebrow" value={selectedPage.eyebrow} onChange={(eyebrow) => updateSelectedPage({ eyebrow })} />
              <TextField id="page-title" label="Page Title" value={selectedPage.title} onChange={(title) => updateSelectedPage({ title })} />
              <TextareaField id="page-description" label="Page Description" value={selectedPage.description} onChange={(description) => updateSelectedPage({ description })} />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white">Page Sections</h4>
                <Button
                  className="h-9 border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  type="button"
                  variant="outline"
                  onClick={addSection}
                >
                  <Plus className="size-4" />
                  Add Section
                </Button>
              </div>

              {selectedPage.sections.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                  This page uses only hero text.
                </div>
              ) : null}

              {selectedPage.sections.map((section, index) => (
                <div key={`${selectedPage.id}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">Section {index + 1}</p>
                    <Button
                      className="border-oxblood/50 bg-oxblood/20 text-[#ffd5dd] hover:bg-oxblood/30"
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      onClick={() => removeSection(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1fr_10rem]">
                    <TextField id={`section-title-${index}`} label="Section Title" value={section.title} onChange={(title) => updateSection(index, { title })} />
                    <div>
                      {fieldLabel(`section-tone-${index}`, 'Tone')}
                      <select
                        id={`section-tone-${index}`}
                        className={cn('mt-2', selectClass)}
                        value={section.tone ?? 'light'}
                        onChange={(event) => updateSection(index, { tone: event.target.value === 'dark' ? 'dark' : 'light' })}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                    <TextareaField id={`section-body-${index}`} label="Section Body" value={section.body} onChange={(body) => updateSection(index, { body })} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Button className="h-10 w-fit bg-gold text-charcoal hover:bg-gold/90" disabled={saving || !selectedPage} type="submit">
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Selected Page'}
        </Button>
      </form>

    </div>
  );
}

function TextField({
  id,
  label,
  onChange,
  type = 'text',
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <div>
      {fieldLabel(id, label)}
      <Input
        id={id}
        className={cn('mt-2', fieldClass)}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="lg:col-span-2">
      {fieldLabel(id, label)}
      <textarea
        id={id}
        className={textAreaClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
