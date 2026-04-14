import { requireAdmin } from '@/lib/server-auth';

export default async function TemplatesLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
