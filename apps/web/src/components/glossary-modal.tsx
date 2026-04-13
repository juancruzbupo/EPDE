'use client';

import { GLOSSARY } from '@epde/shared';
import { BookOpen, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function GlossaryButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') setSearch(detail);
      setOpen(true);
    };
    window.addEventListener('open-glossary', handler);
    return () => window.removeEventListener('open-glossary', handler);
  }, []);

  const filtered = search.trim()
    ? GLOSSARY.filter(
        (e) =>
          e.term.toLowerCase().includes(search.toLowerCase()) ||
          e.aka?.toLowerCase().includes(search.toLowerCase()) ||
          e.definition.toLowerCase().includes(search.toLowerCase()),
      )
    : GLOSSARY;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Glosario de términos">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            Glosario
          </DialogTitle>
          <DialogDescription>
            Términos que usamos en EPDE explicados de forma simple.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Buscar término..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {filtered.map((entry) => (
            <div key={entry.term} className="border-border border-b pb-3 last:border-0">
              <p className="text-sm font-semibold">
                {entry.term}
                {entry.aka && (
                  <span className="text-muted-foreground ml-1 font-normal">({entry.aka})</span>
                )}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                {entry.definition}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No se encontraron términos para &quot;{search}&quot;
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
