'use client';

import type { BudgetAuditLogPublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import {
  CheckCircle,
  Clock,
  Edit,
  FileText,
  MessageSquare,
  Paperclip,
  RotateCcw,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudgetAuditLog } from '@/hooks/use-budgets';

const ACTION_CONFIG: Record<string, { icon: typeof Clock; label: string }> = {
  created: { icon: FileText, label: 'Presupuesto creado' },
  edited: { icon: Edit, label: 'Presupuesto editado' },
  quoted: { icon: Clock, label: 'Cotización enviada' },
  're-quoted': { icon: RotateCcw, label: 'Cotización actualizada' },
  approved: { icon: CheckCircle, label: 'Presupuesto aprobado' },
  rejected: { icon: XCircle, label: 'Presupuesto rechazado' },
  in_progress: { icon: Clock, label: 'Trabajo iniciado' },
  completed: { icon: CheckCircle, label: 'Trabajo completado' },
  expired: { icon: XCircle, label: 'Cotización expirada' },
  comment_added: { icon: MessageSquare, label: 'Comentario agregado' },
  attachments_added: { icon: Paperclip, label: 'Adjuntos agregados' },
};

function TimelineEntry({ entry }: { entry: BudgetAuditLogPublic }) {
  const config = ACTION_CONFIG[entry.action] ?? { icon: Clock, label: entry.action };
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-0.5 pt-0.5">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-muted-foreground text-xs">
          {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
        </p>
      </div>
    </div>
  );
}

export function BudgetTimeline({ budgetId }: { budgetId: string }) {
  const { data: entries, isLoading } = useBudgetAuditLog(budgetId);

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
