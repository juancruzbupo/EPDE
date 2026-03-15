import { redirect } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { getServerUser } from '@/lib/server-auth';

/**
 * Dashboard layout — server-side auth gate.
 * Intentionally blocks on getServerUser() to prevent flash of authenticated content.
 * Individual pages handle their own loading states via loading.tsx.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar className="sticky top-0 hidden h-screen lg:flex" />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
