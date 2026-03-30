import type { ServiceRequestAuditLogPublic } from '@epde/shared';
import { formatRelativeDate, SERVICE_AUDIT_ACTION_LABELS } from '@epde/shared';
import { Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

function AuditLogEntry({ entry }: { entry: ServiceRequestAuditLogPublic }) {
  const note = (entry.after as Record<string, unknown>)?.note as string | undefined;

  return (
    <View className="border-border border-b py-2">
      <Text style={TYPE.labelMd} className="text-foreground">
        {SERVICE_AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
      </Text>
      {note && (
        <Text style={TYPE.bodySm} className="text-foreground mt-0.5 italic">
          {note}
        </Text>
      )}
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
      </Text>
    </View>
  );
}

interface ServiceRequestTimelineProps {
  auditLog: ServiceRequestAuditLogPublic[] | undefined;
}

export function ServiceRequestTimeline({ auditLog }: ServiceRequestTimelineProps) {
  return (
    <CollapsibleSection title="Historial" count={auditLog?.length} defaultOpen={false}>
      <View className="border-border bg-card rounded-xl border px-3">
        {auditLog && auditLog.length > 0 ? (
          auditLog.map((entry) => <AuditLogEntry key={entry.id} entry={entry} />)
        ) : (
          <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
            Sin historial
          </Text>
        )}
      </View>
    </CollapsibleSection>
  );
}
