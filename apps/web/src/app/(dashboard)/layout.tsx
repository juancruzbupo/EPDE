import { redirect } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { getServerUser } from '@/lib/server-auth';
import { ServerUserProvider } from '@/providers/server-user-provider';

/**
 * Dashboard layout — server-side auth gate.
 * Passes server-decoded user (role) to client via ServerUserProvider,
 * so dashboard page can render immediately without waiting for GET /auth/me.
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
          <ServerUserProvider role={user.role} email={user.email}>
            {children}
          </ServerUserProvider>
        </main>
      </div>
    </div>
  );
}
