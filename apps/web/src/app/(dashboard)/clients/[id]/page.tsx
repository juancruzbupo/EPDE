import { notFound } from 'next/navigation';
import type { ClientPublic, ApiResponse } from '@epde/shared';
import { serverFetch } from '@/lib/server-api';
import { ClientDetail } from './client-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const data = await serverFetch<ApiResponse<ClientPublic>>(`/clients/${id}`);

  if (!data?.data) notFound();

  return <ClientDetail id={id} initialData={data} />;
}
