import { redirect } from 'next/navigation';

import { PrivateAdminDashboard } from '@/components/private-admin-dashboard';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect('/admin');
  }

  return <PrivateAdminDashboard admin={admin} />;
}
