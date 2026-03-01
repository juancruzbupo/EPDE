import { notFound } from 'next/navigation';
import { UserRole } from '@epde/shared';
import type { ServiceRequestPublic, ApiResponse } from '@epde/shared';
import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';
import { ServiceRequestDetail } from './service-request-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServiceRequestDetailPage({ params }: Props) {
  const { id } = await params;

  const [data, user] = await Promise.all([
    serverFetch<ApiResponse<ServiceRequestPublic>>(`/service-requests/${id}`),
    getServerUser(),
  ]);

  if (!data?.data) notFound();

  const isAdmin = user?.role === UserRole.ADMIN;

  return <ServiceRequestDetail id={id} isAdmin={isAdmin} initialData={data} />;
}
