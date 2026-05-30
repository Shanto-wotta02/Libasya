import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#08090a] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-12 w-full rounded-lg bg-white/10" />
        <Skeleton className="mt-6 h-[58svh] w-full rounded-lg bg-white/10" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-lg bg-white/10" />
              <Skeleton className="mt-4 h-5 w-3/4 bg-white/10" />
              <Skeleton className="mt-3 h-4 w-full bg-white/10" />
              <Skeleton className="mt-2 h-4 w-2/3 bg-white/10" />
              <Skeleton className="mt-4 h-10 w-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
