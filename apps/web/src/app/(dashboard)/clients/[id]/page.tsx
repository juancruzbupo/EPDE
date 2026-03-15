import type { ApiResponse, ClientPublic } from '@epde/shared';
import { notFound } from 'next/navigation';

import { serverFetch } from '@/lib/server-api';
import { getServerUser } from '@/lib/server-auth';

import { ClientDetail } from './client-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const [data, _user] = await Promise.all([
    serverFetch<ApiResponse<ClientPublic>>(`/clients/${id}`),
    getServerUser(),
  ]);

  if (!data?.data) notFound();

  return <ClientDetail id={id} initialData={data.data} />;
}
