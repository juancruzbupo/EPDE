import { requireAdmin } from '@/lib/server-auth';

export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
