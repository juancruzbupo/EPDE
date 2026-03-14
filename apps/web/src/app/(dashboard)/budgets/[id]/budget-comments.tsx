'use client';

import type { BudgetCommentPublic } from '@epde/shared';
import { BUDGET_TERMINAL_STATUSES } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAddBudgetComment, useBudgetComments } from '@/hooks/use-budgets';

function CommentItem({ comment }: { comment: BudgetCommentPublic }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{comment.user.name}</span>
        <span className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
        </span>
      </div>
      <p className="text-sm">{comment.content}</p>
    </div>
  );
}

interface BudgetCommentsProps {
  budgetId: string;
  budgetStatus: string;
}

export function BudgetComments({ budgetId, budgetStatus }: BudgetCommentsProps) {
  const { data: comments, isLoading } = useBudgetComments(budgetId);
  const addComment = useAddBudgetComment();
  const [content, setContent] = useState('');

  const isTerminal = BUDGET_TERMINAL_STATUSES.includes(budgetStatus as never);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addComment.mutate({ budgetId, content: content.trim() }, { onSuccess: () => setContent('') });
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
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sin comentarios todavía</p>
        )}

        {!isTerminal && (
          <div className="flex gap-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribir un comentario..."
              rows={2}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!content.trim() || addComment.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
