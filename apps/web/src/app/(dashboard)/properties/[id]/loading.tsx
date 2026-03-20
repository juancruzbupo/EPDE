import { Skeleton } from '@/components/ui/skeleton';

export default function PropertyDetailLoading() {
  return (
    <div role="status" aria-label="Cargando propiedad" className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
