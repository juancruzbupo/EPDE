'use client';

import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';
import { use, useEffect } from 'react';

import { ErrorState } from '@/components/error-state';
import { getPropertyReport } from '@/lib/api/properties';

import { ReportCategoryBreakdown } from './components/report-category-breakdown';
import { ReportCover } from './components/report-cover';
import { ReportExecutiveSummary } from './components/report-executive-summary';
import { ReportFooter } from './components/report-footer';
import { ReportHeader } from './components/report-header';
import { ReportInspectionHistory } from './components/report-inspection-history';
import { ReportMaintenancePlan } from './components/report-maintenance-plan';
import { ReportOverdueTasks } from './components/report-overdue-tasks';
import { ReportPhotoGallery } from './components/report-photo-gallery';
import { PRIORITY_ORDER } from './components/report-primitives';
import { ReportSectorBreakdown } from './components/report-sector-breakdown';

export default function PropertyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  useEffect(() => {
    document.title = 'Informe Técnico | EPDE';
  }, []);

  const {
    data: report,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.properties, id, 'report'],
    queryFn: ({ signal }) => getPropertyReport(id, signal).then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="text-muted-foreground text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p>Generando informe técnico...</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return <ErrorState message="No se pudo generar el informe" onRetry={refetch} />;
  }

  const {
    property,
    healthIndex,
    sectorBreakdown,
    categoryBreakdown,
    overdueTasks,
    upcomingTasks,
    recentLogs,
    taskStats,
  } = report;

  // Sort by priority/urgency
  const sortedOverdue = [...overdueTasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9),
  );
  const sortedCats = [...categoryBreakdown].sort(
    (a, b) => b.overdueTasks - a.overdueTasks || b.totalTasks - a.totalTasks,
  );
  const sortedSectors = [...sectorBreakdown]
    .map((s) => ({
      ...s,
      score: s.total > 0 ? Math.round(((s.total - s.overdue) / s.total) * 100) : 100,
    }))
    .sort((a, b) => a.score - b.score);
  const logsWithPhotos = recentLogs.filter(
    (l): l is typeof l & { photoUrl: string } => !!l.photoUrl,
  );

  return (
    <div className="report-container mx-auto max-w-4xl">
      <ReportHeader propertyId={id} />
      <ReportCover property={property} score={healthIndex.score} totalTasks={taskStats.total} />
      <ReportExecutiveSummary
        score={healthIndex.score}
        dimensions={healthIndex.dimensions}
        taskStats={taskStats}
      />
      <ReportSectorBreakdown sectors={sortedSectors} />
      <ReportCategoryBreakdown categories={sortedCats} />
      <ReportOverdueTasks tasks={sortedOverdue} />
      <ReportInspectionHistory logs={recentLogs} />
      <ReportPhotoGallery logs={logsWithPhotos} />
      <ReportMaintenancePlan tasks={upcomingTasks} />
      <ReportFooter />
    </div>
  );
}
