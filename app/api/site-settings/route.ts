import { NextResponse } from 'next/server';

import { getSiteSettings, serializeSiteSettings } from '@/lib/site-settings';

export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json({ settings: serializeSiteSettings(settings) });
}
