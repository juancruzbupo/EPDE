import { UserRole } from '@epde/shared';

import { getServerUser } from '@/lib/server-auth';

import { ServiceRequestDetail } from './service-request-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServiceRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getServerUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENT;

  return <ServiceRequestDetail id={id} isAdmin={isAdmin} isClient={isClient} />;
}
