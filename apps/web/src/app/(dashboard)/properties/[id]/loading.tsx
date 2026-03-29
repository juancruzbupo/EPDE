import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';

export default function PropertyDetailLoading() {
  return (
    <div role="status" aria-label="Cargando propiedad" className="space-y-6">
      <SkeletonShimmer className="h-8 w-64" />
      <SkeletonShimmer className="h-40 rounded-lg" />
      <SkeletonShimmer className="h-64 rounded-lg" />
    </div>
  );
}
