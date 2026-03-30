import type { BudgetAuditLogPublic } from '@epde/shared';
import { BUDGET_AUDIT_ACTION_LABELS, formatRelativeDate } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

function AuditLogEntry({ entry }: { entry: BudgetAuditLogPublic }) {
  return (
    <View className="border-border border-b py-2">
      <Text style={TYPE.labelMd} className="text-foreground">
        {BUDGET_AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {entry.user.name} · {formatRelativeDate(new Date(entry.changedAt))}
      </Text>
    </View>
  );
}

interface BudgetTimelineProps {
  auditLog: BudgetAuditLogPublic[] | undefined;
}

export const BudgetTimeline = React.memo(function BudgetTimeline({
  auditLog,
}: BudgetTimelineProps) {
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
});
