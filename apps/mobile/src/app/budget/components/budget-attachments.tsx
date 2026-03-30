import type { BudgetAttachmentPublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import React from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

function AttachmentItem({ attachment }: { attachment: BudgetAttachmentPublic }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={attachment.fileName}
      onPress={() => Linking.openURL(attachment.url)}
      className="border-border border-b py-2"
    >
      <Text style={TYPE.labelMd} className="text-primary" ellipsizeMode="tail" numberOfLines={1}>
        {attachment.fileName}
      </Text>
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {formatRelativeDate(new Date(attachment.createdAt))}
      </Text>
    </Pressable>
  );
}

interface BudgetAttachmentsProps {
  attachments: BudgetAttachmentPublic[] | undefined;
  isTerminal: boolean;
  isUploading: boolean;
  onAddAttachment: () => void;
}

export const BudgetAttachments = React.memo(function BudgetAttachments({
  attachments,
  isTerminal,
  isUploading,
  onAddAttachment,
}: BudgetAttachmentsProps) {
  return (
    <CollapsibleSection title="Adjuntos" count={attachments?.length}>
      <View className="border-border bg-card rounded-xl border px-3">
        {attachments && attachments.length > 0 ? (
          attachments.map((att) => <AttachmentItem key={att.id} attachment={att} />)
        ) : (
          <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
            Sin adjuntos
          </Text>
        )}
      </View>

      {!isTerminal && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adjuntar archivo"
            onPress={onAddAttachment}
            disabled={isUploading}
            className="bg-primary mt-2 items-center rounded-lg py-2"
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.primaryForeground} />
            ) : (
              <Text style={TYPE.labelMd} className="text-primary-foreground">
                Adjuntar archivo
              </Text>
            )}
          </Pressable>
          <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 text-center">
            Max. 10 MB por archivo
          </Text>
        </>
      )}
    </CollapsibleSection>
  );
});
