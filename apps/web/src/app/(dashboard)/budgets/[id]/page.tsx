'use client';

import { UserRole } from '@epde/shared';
import { use } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { BudgetDetail } from './budget-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BudgetDetailPage({ params }: Props) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === UserRole.ADMIN;
  const isClient = role === UserRole.CLIENT;

  return <BudgetDetail id={id} isAdmin={isAdmin} isClient={isClient} />;
}
