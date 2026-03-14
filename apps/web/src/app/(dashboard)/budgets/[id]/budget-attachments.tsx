'use client';

import type { BudgetAttachmentPublic } from '@epde/shared';
import { BUDGET_TERMINAL_STATUSES } from '@epde/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Paperclip } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AttachmentItem({ attachment }: { attachment: BudgetAttachmentPublic }) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
    >
      <Paperclip className="text-muted-foreground h-4 w-4 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-muted-foreground text-xs">
          {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true, locale: es })}
        </p>
      </div>
      <Download className="text-muted-foreground h-4 w-4 shrink-0" />
    </a>
  );
}

interface BudgetAttachmentsProps {
  attachments: BudgetAttachmentPublic[];
  budgetStatus: string;
}

export function BudgetAttachments({ attachments, budgetStatus }: BudgetAttachmentsProps) {
  const isTerminal = BUDGET_TERMINAL_STATUSES.includes(budgetStatus as never);

  if (!attachments.length && isTerminal) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adjuntos</CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length > 0 ? (
          <div className="space-y-1">
            {attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sin adjuntos</p>
        )}
      </CardContent>
    </Card>
  );
}
