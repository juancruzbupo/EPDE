'use client';

import { useState } from 'react';
import { useTaskNotes, useAddTaskNote } from '@/hooks/use-maintenance-plans';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskNotesProps {
  planId: string;
  taskId: string;
}

export function TaskNotes({ planId, taskId }: TaskNotesProps) {
  const { data: notes, isLoading } = useTaskNotes(planId, taskId);
  const addNote = useAddTaskNote();
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addNote.mutate(
      { planId, taskId, content: content.trim() },
      { onSuccess: () => setContent('') },
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Agregar una nota..."
          className="flex-1 resize-none"
          rows={2}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || addNote.isPending}
          aria-label="Enviar nota"
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-muted/30 rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{note.author.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8">
          <MessageSquare className="text-muted-foreground/50 h-8 w-8" />
          <p className="text-muted-foreground text-sm">Sin notas</p>
        </div>
      )}
    </div>
  );
}
