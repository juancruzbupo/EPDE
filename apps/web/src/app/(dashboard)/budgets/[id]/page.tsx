import { UserRole } from '@epde/shared';

import { getServerUser } from '@/lib/server-auth';

import { BudgetDetail } from './budget-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BudgetDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getServerUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  return <BudgetDetail id={id} isAdmin={isAdmin} isClient={isClient} />;
}
