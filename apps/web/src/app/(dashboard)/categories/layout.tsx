import { requireAdmin } from '@/lib/server-auth';

export default async function CategoriesLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
