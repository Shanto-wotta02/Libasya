import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest, NextResponse } from 'next/server';

import { syncClerkUserToDatabase } from '@/lib/clerk-user-sync';

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const user = await syncClerkUserToDatabase(event.data);

      return NextResponse.json({
        ok: true,
        userId: user.id,
        role: user.role,
      });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Clerk webhook verification failed.',
      },
      { status: 400 },
    );
  }
}
