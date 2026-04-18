'use client';

import type { ProfessionalTimelineNotePublic } from '@epde/shared';
import { MessageSquare, Send, Tag, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTag, useCreateTimelineNote, useDeleteTag } from '@/hooks/use-professionals';

export function NotesTagsTab({
  professionalId,
  notes,
  tags,
}: {
  professionalId: string;
  notes: ProfessionalTimelineNotePublic[];
  tags: string[];
}) {
  const [noteContent, setNoteContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const createNote = useCreateTimelineNote(professionalId);
  const createTag = useCreateTag(professionalId);
  const deleteTag = useDeleteTag(professionalId);

  const handleSubmitNote = () => {
    if (!noteContent.trim()) return;
    createNote.mutate(
      { content: noteContent.trim() },
      {
        onSuccess: () => setNoteContent(''),
      },
    );
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    createTag.mutate(
      { tag: trimmed },
      {
        onSuccess: () => setTagInput(''),
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <h3 className="text-sm font-medium">Tags operativos</h3>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-xs">Sin tags todavía</p>
            ) : (
              tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => deleteTag.mutate(t)}
                    aria-label={`Quitar ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="confiable, caro, impuntual..."
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={createTag.isPending || !tagInput.trim()}
            >
              Agregar
            </Button>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Solo letras y guiones bajos. Se normalizan con # al inicio.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h3 className="text-sm font-medium">Notas privadas</h3>
          </div>
          <div className="mb-4 flex gap-2">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Impresión post-trabajo, incidente, fortaleza..."
              rows={2}
              maxLength={2000}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSubmitNote}
              disabled={createNote.isPending || !noteContent.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center text-xs">Sin notas todavía</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="border-border border-l-2 pl-3">
                  <p className="text-muted-foreground text-xs">
                    {new Date(n.createdAt).toLocaleString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
