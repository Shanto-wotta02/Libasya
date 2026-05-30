import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08090a] px-4 py-12 text-white">
      <section className="w-full max-w-xl rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/25">
        <Skeleton className="h-6 w-32 rounded-full bg-white/15" />
        <Skeleton className="mt-5 h-9 w-72 rounded-lg bg-white/15" />
        <Skeleton className="mt-4 h-4 w-full rounded-full bg-white/15" />
        <Skeleton className="mt-2 h-4 w-5/6 rounded-full bg-white/15" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-lg bg-white/15" />
          <Skeleton className="h-11 flex-1 rounded-lg bg-white/15" />
        </div>
      </section>
    </main>
  );
}
