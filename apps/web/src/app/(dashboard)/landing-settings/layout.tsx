import { requireAdmin } from '@/lib/server-auth';

export default async function LandingSettingsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
