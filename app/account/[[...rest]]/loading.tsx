import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-4 py-12">
      <section className="w-full max-w-5xl">
        <Skeleton className="mb-4 h-10 w-32 rounded-full" />
        <div className="rounded-[1.5rem] border border-charcoal/10 bg-white/78 p-5 shadow-luxury">
          <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
            <div className="space-y-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-4 w-44 rounded-full" />
              <div className="pt-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="mb-3 h-10 rounded-lg" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-52 rounded-lg" />
              <Skeleton className="mt-5 h-40 rounded-xl" />
              <Skeleton className="mt-4 h-40 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
