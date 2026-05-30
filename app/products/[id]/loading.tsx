import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-ivory px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="mb-6 h-5 w-32 rounded-full" />
        <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
          <div className="grid gap-5">
            <div className="rounded-[2rem] border border-charcoal/10 bg-white/75 p-6 shadow-luxury">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="mt-6 h-12 w-4/5 rounded-lg" />
              <Skeleton className="mt-4 h-4 w-full rounded-full" />
              <Skeleton className="mt-2 h-4 w-3/4 rounded-full" />
              <Skeleton className="mt-7 h-10 w-44 rounded-lg" />
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-[1.2rem]" />
                ))}
              </div>
            </div>
            <Skeleton className="h-72 rounded-[1.5rem]" />
          </div>
        </section>
      </div>
    </main>
  );
}
