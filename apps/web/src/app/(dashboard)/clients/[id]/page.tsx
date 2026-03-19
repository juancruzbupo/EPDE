'use client';

import { use, useEffect } from 'react';

import { ClientDetail } from './client-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: Props) {
  const { id } = use(params);

  useEffect(() => {
    document.title = 'Cliente | EPDE';
  }, []);

  return <ClientDetail id={id} />;
}
