import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
  return (
    <main className="min-h-screen bg-[#08090a] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-5 w-40 bg-white/15" />
            <Skeleton className="mt-3 h-8 w-72 bg-white/15" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg bg-white/15" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg bg-white/15" />
          ))}
        </div>
        <Skeleton className="h-[55svh] rounded-lg bg-white/15" />
      </div>
    </main>
  );
}
