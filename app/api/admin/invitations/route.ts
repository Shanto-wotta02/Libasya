import { NextRequest, NextResponse } from 'next/server';

import { getAdminSession } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

const invitationInclude = {
  invitedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  acceptedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

async function getAccessSettings() {
  return prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main' },
    select: {
      adminInvitationsEnabled: true,
    },
  });
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const accessSettings = await getAccessSettings();
  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: 'desc' },
    include: invitationInclude,
  });

  return NextResponse.json({
    adminInvitationsEnabled: accessSettings.adminInvitationsEnabled,
    invitations,
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const accessSettings = await getAccessSettings();

  if (!accessSettings.adminInvitationsEnabled) {
    return NextResponse.json(
      { error: 'Admin invitations are currently paused.' },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    email?: string;
  };
  const email = normalizeEmail(body.email);
  const role = 'ADMIN';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
    },
  });

  if (existingUser?.role === 'ADMIN') {
    return NextResponse.json(
      { error: 'This user is already an admin.' },
      { status: 409 },
    );
  }

  const existingPendingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const invitation = existingPendingInvitation
    ? await prisma.invitation.update({
        where: { id: existingPendingInvitation.id },
        data: {
          role,
          invitedById: admin.id,
        },
        include: invitationInclude,
      })
    : await prisma.invitation.create({
        data: {
          email,
          role,
          invitedById: admin.id,
        },
        include: invitationInclude,
      });

  return NextResponse.json(
    {
      invitation,
      notification: `Mock notification: ${email} has been invited as ${role.toLowerCase()}.`,
    },
    { status: existingPendingInvitation ? 200 : 201 },
  );
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await request.json()) as {
    adminInvitationsEnabled?: unknown;
  };

  if (typeof body.adminInvitationsEnabled !== 'boolean') {
    return NextResponse.json(
      { error: 'adminInvitationsEnabled must be true or false.' },
      { status: 400 },
    );
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {
      adminInvitationsEnabled: body.adminInvitationsEnabled,
    },
    create: {
      id: 'main',
      adminInvitationsEnabled: body.adminInvitationsEnabled,
    },
    select: {
      adminInvitationsEnabled: true,
    },
  });

  return NextResponse.json({
    adminInvitationsEnabled: settings.adminInvitationsEnabled,
  });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession(request);

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Invitation id is required.' }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id },
    select: {
      email: true,
      status: true,
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation was not found.' }, { status: 404 });
  }

  if (invitation.status !== 'PENDING') {
    return NextResponse.json(
      { error: 'Accepted invitations are kept as an audit record.' },
      { status: 409 },
    );
  }

  await prisma.invitation.delete({ where: { id } });

  return NextResponse.json({
    ok: true,
    notification: `Mock notification: ${invitation.email}'s pending admin invitation was cancelled.`,
  });
}
