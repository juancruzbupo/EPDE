import type { ApiResponse, ClientPublic } from '@epde/shared';
import { notFound } from 'next/navigation';

import { serverFetch } from '@/lib/server-api';

import { ClientDetail } from './client-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const data = await serverFetch<ApiResponse<ClientPublic>>(`/clients/${id}`);

  if (!data?.data) notFound();

  return <ClientDetail id={id} initialData={data.data} />;
}
