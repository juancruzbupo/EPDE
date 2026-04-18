'use client';

import { UserRole } from '@epde/shared';
import { use, useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { InspectionDetail } from './inspection-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function TechnicalInspectionDetailPage({ params }: Props) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === UserRole.ADMIN;
  const isClient = role === UserRole.CLIENT;

  useEffect(() => {
    document.title = 'Inspección técnica | EPDE';
  }, []);

  return <InspectionDetail id={id} isAdmin={isAdmin} isClient={isClient} />;
}
