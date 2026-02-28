'use client';

import { useState } from 'react';
import { useTaskNotes, useAddTaskNote } from '@/hooks/use-maintenance-plans';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Send } from 'lucide-react';
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Agregar una nota..."
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          rows={2}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || addNote.isPending}
          aria-label="Enviar nota"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{note.author.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm">{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-2 text-center text-sm">Sin notas</p>
      )}
    </div>
  );
}
