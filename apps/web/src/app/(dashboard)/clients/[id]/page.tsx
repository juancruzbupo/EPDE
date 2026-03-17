'use client';

import { use } from 'react';

import { ClientDetail } from './client-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: Props) {
  const { id } = use(params);

  return <ClientDetail id={id} />;
}
