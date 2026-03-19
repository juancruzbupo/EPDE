'use client';

import { UserRole } from '@epde/shared';
import { use, useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { PropertyDetail } from './property-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: Props) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === UserRole.ADMIN;

  useEffect(() => {
    document.title = 'Propiedad | EPDE';
  }, []);

  return <PropertyDetail id={id} isAdmin={isAdmin} />;
}
