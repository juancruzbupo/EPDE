'use client';

import type { ServiceRequestAuditLogPublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import { CheckCircle, Clock, Edit, Eye, FileText, Play, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiceRequestAuditLog } from '@/hooks/use-service-requests';

const ACTION_CONFIG: Record<string, { icon: typeof Clock; label: string }> = {
  created: { icon: FileText, label: 'Solicitud creada' },
  edited: { icon: Edit, label: 'Solicitud editada' },
  'in-review': { icon: Eye, label: 'Pasada a revisión' },
  'in-progress': { icon: Play, label: 'Trabajo iniciado' },
  resolved: { icon: CheckCircle, label: 'Marcada como resuelta' },
  closed: { icon: XCircle, label: 'Solicitud cerrada' },
};

function TimelineEntry({ entry }: { entry: ServiceRequestAuditLogPublic }) {
  const config = ACTION_CONFIG[entry.action] ?? { icon: Clock, label: entry.action };
  const Icon = config.icon;
  const note = (entry.after as Record<string, unknown>)?.note as string | undefined;

  return (
    <div className="flex gap-3">
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-0.5 pt-0.5">
        <p className="text-sm font-medium">{config.label}</p>
        {note && <p className="text-muted-foreground text-sm italic">{note}</p>}
        <p className="text-muted-foreground text-xs">
          {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
        </p>
      </div>
    </div>
  );
}

export function ServiceRequestTimeline({ serviceRequestId }: { serviceRequestId: string }) {
  const { data: entries, isLoading } = useServiceRequestAuditLog(serviceRequestId);

  if (isLoading || !entries?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <TimelineEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
