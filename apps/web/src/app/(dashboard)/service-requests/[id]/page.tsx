import type { ApiResponse, ServiceRequestPublic } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { notFound } from 'next/navigation';

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
  const isClient = user?.role === UserRole.CLIENT;

  return (
    <ServiceRequestDetail id={id} isAdmin={isAdmin} isClient={isClient} initialData={data.data} />
  );
}
