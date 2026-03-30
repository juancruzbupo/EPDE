import type { TaskNotePublic } from '@epde/shared';
import { formatRelativeDate } from '@epde/shared';
import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

const NoteItem = React.memo(function NoteItem({ note }: { note: TaskNotePublic }) {
  return (
    <View className="border-border border-b py-3">
      <View className="flex-row items-center justify-between">
        <Text style={TYPE.labelLg} className="text-foreground">
          {note.author.name}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground">
          {formatRelativeDate(new Date(note.createdAt))}
        </Text>
      </View>
      <Text style={TYPE.bodyMd} className="text-foreground mt-1">
        {note.content}
      </Text>
    </View>
  );
});

interface TaskNotesSectionProps {
  notes: TaskNotePublic[] | undefined;
  noteContent: string;
  onNoteContentChange: (text: string) => void;
  onAddNote: () => void;
  isAddingNote: boolean;
}

export const TaskNotesSection = React.memo(function TaskNotesSection({
  notes,
  noteContent,
  onNoteContentChange,
  onAddNote,
  isAddingNote,
}: TaskNotesSectionProps) {
  return (
    <CollapsibleSection title="Notas" count={notes?.length ?? 0}>
      {/* Add note form */}
      <View className="mb-3 flex-row items-end gap-2">
        <TextInput
          value={noteContent}
          onChangeText={onNoteContentChange}
          placeholder="Agregar una nota..."
          placeholderTextColor={COLORS.mutedForeground}
          multiline
          maxLength={2000}
          style={[TYPE.bodyMd, { minHeight: 40, textAlignVertical: 'top' }]}
          className="border-border bg-card text-foreground flex-1 rounded-xl border px-3 py-2"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar nota"
          onPress={onAddNote}
          disabled={!noteContent.trim() || isAddingNote}
          className={`rounded-xl px-4 py-2.5 ${noteContent.trim() ? 'bg-primary' : 'bg-muted'}`}
        >
          <Text
            style={TYPE.titleSm}
            className={noteContent.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}
          >
            Enviar
          </Text>
        </Pressable>
      </View>

      <View className="border-border bg-card rounded-xl border px-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => <NoteItem key={note.id} note={note} />)
        ) : (
          <View className="py-4">
            <Text style={TYPE.bodyMd} className="text-muted-foreground text-center">
              Sin notas
            </Text>
          </View>
        )}
      </View>
    </CollapsibleSection>
  );
});
