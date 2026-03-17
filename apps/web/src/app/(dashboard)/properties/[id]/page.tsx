import { UserRole } from '@epde/shared';

import { getServerUser } from '@/lib/server-auth';

import { PropertyDetail } from './property-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getServerUser();
  const isAdmin = user?.role === UserRole.ADMIN;

  return <PropertyDetail id={id} isAdmin={isAdmin} />;
}
