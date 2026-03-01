import { notFound } from 'next/navigation';
import { UserRole } from '@epde/shared';
import type { BudgetRequestPublic, ApiResponse } from '@epde/shared';
import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';
import { BudgetDetail } from './budget-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BudgetDetailPage({ params }: Props) {
  const { id } = await params;

  const [data, user] = await Promise.all([
    serverFetch<ApiResponse<BudgetRequestPublic>>(`/budgets/${id}`),
    getServerUser(),
  ]);

  if (!data?.data) notFound();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  return <BudgetDetail id={id} isAdmin={isAdmin} isClient={isClient} initialData={data} />;
}
