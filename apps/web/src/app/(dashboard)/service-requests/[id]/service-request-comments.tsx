'use client';

import type { ServiceRequestCommentPublic } from '@epde/shared';
import { formatRelativeDate, isServiceRequestTerminal } from '@epde/shared';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  useAddServiceRequestComment,
  useServiceRequestComments,
} from '@/hooks/use-service-requests';

function CommentItem({
  comment,
  isNew,
}: {
  comment: ServiceRequestCommentPublic;
  isNew?: boolean;
}) {
  return (
    <div
      className={`space-y-1 rounded-md px-3 py-2 transition-colors ${
        isNew ? 'bg-success/10 motion-safe:animate-in motion-safe:fade-in duration-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{comment.user.name}</span>
        <span className="text-muted-foreground text-xs">
          {formatRelativeDate(new Date(comment.createdAt))}
        </span>
      </div>
      <p className="text-sm">{comment.content}</p>
    </div>
  );
}

interface ServiceRequestCommentsProps {
  serviceRequestId: string;
  serviceRequestStatus: string;
}

export function ServiceRequestComments({
  serviceRequestId,
  serviceRequestStatus,
}: ServiceRequestCommentsProps) {
  const { data: comments, isLoading } = useServiceRequestComments(serviceRequestId);
  const addComment = useAddServiceRequestComment();
  const [content, setContent] = useState('');
  // Track del último comment visible para highlight del nuevo tras refetch.
  // Solucionamos M2 (feedback visual) sin cambiar el hook: cuando el count
  // crece post-submit, el primero/último es el recién agregado.
  const previousCountRef = useRef(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const isTerminal = isServiceRequestTerminal(serviceRequestStatus);

  useEffect(() => {
    if (!comments) return;
    if (comments.length > previousCountRef.current && previousCountRef.current > 0) {
      // El nuevo es el más reciente (asumiendo orden ascendente por createdAt).
      const latest = comments[comments.length - 1];
      if (latest) {
        setHighlightId(latest.id);
        const t = setTimeout(() => setHighlightId(null), 2000);
        return () => clearTimeout(t);
      }
    }
    previousCountRef.current = comments.length;
  }, [comments]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addComment.mutate(
      { serviceRequestId, content: content.trim() },
      { onSuccess: () => setContent('') },
    );
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comentarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments && comments.length > 0 ? (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} isNew={comment.id === highlightId} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sin comentarios todavía</p>
        )}

        {!isTerminal && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribir un comentario..."
              rows={4}
              className="flex-1"
            />
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || addComment.isPending}
              className="gap-2 sm:self-end"
            >
              <Send className="h-4 w-4" />
              {addComment.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
