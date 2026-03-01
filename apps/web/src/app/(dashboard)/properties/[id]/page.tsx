import { notFound } from 'next/navigation';
import { UserRole } from '@epde/shared';
import type { PropertyPublic, ApiResponse } from '@epde/shared';
import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';
import { PropertyDetail } from './property-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  const [data, user] = await Promise.all([
    serverFetch<ApiResponse<PropertyPublic>>(`/properties/${id}`),
    getServerUser(),
  ]);

  if (!data?.data) notFound();

  const isAdmin = user?.role === UserRole.ADMIN;

  return <PropertyDetail id={id} isAdmin={isAdmin} initialData={data} />;
}
