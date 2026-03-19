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
      <a
        href="#main-content"
        className="bg-background text-primary focus:ring-ring sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2"
      >
        Ir al contenido
      </a>
      <Sidebar className="sticky top-0 hidden h-screen lg:flex" />
      <div className="flex flex-1 flex-col">
        <Header />
        <main id="main-content" className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
