import { UserProfile } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-ivory px-4 py-12">
      <section className="mx-auto grid w-full max-w-5xl gap-4">
        <Link
          className="inline-flex h-10 w-fit items-center rounded-full border border-charcoal/10 bg-white/75 px-4 text-sm font-semibold text-charcoal/65 shadow-sm transition-all hover:bg-charcoal hover:text-ivory"
          href="/"
        >
          Back to Shop
        </Link>
        <div className="grid place-items-center">
          <UserProfile />
        </div>
      </section>
    </main>
  );
}
