import 'server-only';

import { clerkClient } from '@clerk/nextjs/server';
import type { Role } from '@prisma/client';

import prisma from '@/lib/prisma';

type ClerkEmailAddress = {
  id?: string | null;
  email_address?: string | null;
  emailAddress?: string | null;
};

export type ClerkUserLike = {
  id: string;
  first_name?: string | null;
  firstName?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  username?: string | null;
  primary_email_address_id?: string | null;
  primaryEmailAddressId?: string | null;
  email_addresses?: ClerkEmailAddress[];
  emailAddresses?: ClerkEmailAddress[];
};

const syncedUserSelect = {
  id: true,
  clerkId: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

type SyncedUser = {
  id: string;
  clerkId: string | null;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? '';
}

function getPrimaryEmail(clerkUser: ClerkUserLike) {
  const primaryEmailId =
    clerkUser.primary_email_address_id ?? clerkUser.primaryEmailAddressId ?? null;
  const emailAddresses = clerkUser.email_addresses ?? clerkUser.emailAddresses ?? [];

  const primaryEmail = emailAddresses.find((email) => email.id === primaryEmailId);
  const fallbackEmail = emailAddresses[0];

  return normalizeEmail(
    primaryEmail?.email_address ??
      primaryEmail?.emailAddress ??
      fallbackEmail?.email_address ??
      fallbackEmail?.emailAddress,
  );
}

function getDisplayName(clerkUser: ClerkUserLike, email: string) {
  const firstName = clerkUser.first_name ?? clerkUser.firstName ?? '';
  const lastName = clerkUser.last_name ?? clerkUser.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || clerkUser.username || email.split('@')[0] || 'Libasya User';
}

function isClerkNotFoundError(error: unknown) {
  const clerkError = error as {
    status?: number;
    errors?: Array<{ code?: string }>;
  };

  return (
    clerkError.status === 404 ||
    clerkError.errors?.some((item) =>
      ['resource_not_found', 'user_not_found', 'not_found'].includes(item.code ?? ''),
    ) === true
  );
}

async function clerkUserExists(clerkId: string) {
  try {
    const client = await clerkClient();
    await client.users.getUser(clerkId);
    return true;
  } catch (error) {
    return !isClerkNotFoundError(error);
  }
}

async function releaseStaleClerkLink(user: SyncedUser) {
  const role = user.role === 'ADMIN' ? 'USER' : user.role;

  if (!user.clerkId) {
    return { ...user, role };
  }

  await prisma.user.updateMany({
    where: {
      id: user.id,
      clerkId: user.clerkId,
    },
    data: {
      clerkId: null,
      role,
    },
  });

  return {
    ...user,
    clerkId: null,
    role,
  };
}

async function hasActiveClerkAdmin() {
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      clerkId: {
        not: null,
      },
    },
    select: syncedUserSelect,
  });

  for (const adminUser of adminUsers) {
    if (!adminUser.clerkId) {
      continue;
    }

    const existsInClerk = await clerkUserExists(adminUser.clerkId);

    if (existsInClerk) {
      return true;
    }

    await releaseStaleClerkLink(adminUser);
  }

  return false;
}

async function getPendingInvitation(email: string) {
  const accessSettings = await prisma.siteSettings.findUnique({
    where: { id: 'main' },
    select: {
      adminInvitationsEnabled: true,
    },
  });

  if (accessSettings?.adminInvitationsEnabled === false) {
    return null;
  }

  return prisma.invitation.findFirst({
    where: {
      email,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function syncClerkUserToDatabase(clerkUser: ClerkUserLike) {
  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new Error('Clerk user does not have a primary email address.');
  }

  const name = getDisplayName(clerkUser, email);

  const pendingInvitation = await getPendingInvitation(email);

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: syncedUserSelect,
  });

  if (existingByClerkId) {
    const clerkAdminExists = await hasActiveClerkAdmin();
    let role = existingByClerkId.role;

    if (!clerkAdminExists) {
      role = 'ADMIN';
    } else if (pendingInvitation && existingByClerkId.role !== 'ADMIN') {
      role = pendingInvitation.role;
    }

    const user = await prisma.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        name,
        role,
      },
      select: syncedUserSelect,
    });

    if (pendingInvitation) {
      await prisma.invitation.update({
        where: { id: pendingInvitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
          acceptedAt: new Date(),
        },
      });
    }

    return user;
  }

  let existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: syncedUserSelect,
  });

  if (existingByEmail?.clerkId && existingByEmail.clerkId !== clerkUser.id) {
    const linkedClerkUserExists = await clerkUserExists(existingByEmail.clerkId);

    if (linkedClerkUserExists) {
      throw new Error('This email address is already linked to another Clerk user.');
    }

    existingByEmail = await releaseStaleClerkLink(existingByEmail);
  }

  const clerkAdminExists = await hasActiveClerkAdmin();
  let assignedRole: Role = existingByEmail?.role === 'CUSTOMER' ? 'CUSTOMER' : 'USER';

  if (!clerkAdminExists) {
    assignedRole = 'ADMIN';
  } else if (pendingInvitation) {
    assignedRole = pendingInvitation.role;
  }

  const user = existingByEmail
    ? await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          clerkId: clerkUser.id,
          name,
          role: assignedRole,
        },
        select: syncedUserSelect,
      })
    : await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          name,
          email,
          role: assignedRole,
        },
        select: syncedUserSelect,
      });

  if (pendingInvitation) {
    await prisma.invitation.update({
      where: { id: pendingInvitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedById: user.id,
        acceptedAt: new Date(),
      },
    });
  }

  return user;
}
