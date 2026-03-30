import type { BudgetCommentPublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

function CommentItem({ comment }: { comment: BudgetCommentPublic }) {
  return (
    <View className="border-border border-b py-2">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelMd} className="text-foreground">
          {comment.user.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatRelativeDate(new Date(comment.createdAt))}
        </Text>
      </View>
      <Text style={TYPE.bodyMd} className="text-foreground mt-1">
        {comment.content}
      </Text>
    </View>
  );
}

interface BudgetCommentsProps {
  comments: BudgetCommentPublic[] | undefined;
  isTerminal: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onAddComment: () => void;
  isAddingComment: boolean;
}

export const BudgetComments = React.memo(function BudgetComments({
  comments,
  isTerminal,
  commentText,
  onCommentTextChange,
  onAddComment,
  isAddingComment,
}: BudgetCommentsProps) {
  return (
    <CollapsibleSection title="Comentarios" count={comments?.length}>
      <View className="border-border bg-card rounded-xl border px-3">
        {comments && comments.length > 0 ? (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        ) : (
          <Text style={TYPE.bodyMd} className="text-muted-foreground py-3">
            Sin comentarios
          </Text>
        )}
      </View>

      {!isTerminal && (
        <View className="mt-2 flex-row items-end gap-2">
          <TextInput
            value={commentText}
            onChangeText={onCommentTextChange}
            placeholder="Escribi un comentario..."
            placeholderTextColor={COLORS.mutedForeground}
            multiline
            style={[TYPE.bodyMd, { maxHeight: 80, flex: 1 }]}
            className="border-border bg-card text-foreground rounded-lg border px-3 py-2"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar comentario"
            onPress={onAddComment}
            disabled={!commentText.trim() || isAddingComment}
            className="bg-primary rounded-lg px-4 py-2"
          >
            <Text style={TYPE.labelMd} className="text-primary-foreground">
              Enviar
            </Text>
          </Pressable>
        </View>
      )}
    </CollapsibleSection>
  );
});
