import type { TaskLogPublic } from '@epde/shared';
import React from 'react';
import { Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { formatDateES } from '@/lib/date-format';
import { TYPE } from '@/lib/fonts';

const LogItem = React.memo(function LogItem({ log }: { log: TaskLogPublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground">
          {log.user.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatDateES(new Date(log.completedAt))}
        </Text>
      </View>
      {log.notes && (
        <Text style={TYPE.bodyMd} className="text-muted-foreground mt-1">
          {log.notes}
        </Text>
      )}
    </View>
  );
});

interface TaskLogsSectionProps {
  logs: TaskLogPublic[] | undefined;
}

export const TaskLogsSection = React.memo(function TaskLogsSection({ logs }: TaskLogsSectionProps) {
  return (
    <CollapsibleSection title="Historial" count={logs?.length ?? 0}>
      <View className="border-border bg-card rounded-xl border px-4">
        {logs && logs.length > 0 ? (
          logs.map((log) => <LogItem key={log.id} log={log} />)
        ) : (
          <View className="py-4">
            <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
              Sin registros de completado
            </Text>
          </View>
        )}
      </View>
    </CollapsibleSection>
  );
});
