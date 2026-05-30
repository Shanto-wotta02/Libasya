import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

import { getCurrentDatabaseUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const dbUser = await getCurrentDatabaseUser();

  if (dbUser?.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#08090a] px-4 py-12 text-[#f7efe2]">
      <section className="w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="mb-5 inline-flex rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Libasya Admin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Secure admin access
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Admin access is controlled by Clerk sign-in plus the role stored in your Neon database.
          The first synced Clerk user becomes an admin automatically; later admins must be invited
          or promoted by an existing admin.
        </p>

        {dbUser ? (
          <div className="mt-6 rounded-lg border border-oxblood/40 bg-oxblood/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Signed in, no admin role</p>
                <p className="mt-1 text-sm text-white/55">{dbUser.email}</p>
              </div>
              <UserButton />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <SignInButton mode="redirect">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.12]"
                type="button"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-gold px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gold/90"
                type="button"
              >
                Create first account
              </button>
            </SignUpButton>
          </div>
        )}
      </section>
    </main>
  );
}

