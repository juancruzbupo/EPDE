'use client';

import { UserRole } from '@epde/shared';
import { use } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { ServiceRequestDetail } from './service-request-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ServiceRequestDetailPage({ params }: Props) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === UserRole.ADMIN;
  const isClient = role === UserRole.CLIENT;

  return <ServiceRequestDetail id={id} isAdmin={isAdmin} isClient={isClient} />;
}
