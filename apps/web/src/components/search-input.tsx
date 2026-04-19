'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Contextualizá qué se puede buscar (ej. "Buscar por nombre o email...").
   * Genérico "Buscar..." está prohibido — los consumers deben declarar el
   * dominio para que el usuario sepa qué campos alimenta el filtro.
   */
  placeholder: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={`relative w-full sm:min-w-[280px] ${className ?? ''}`}>
      <Search
        aria-hidden="true"
        className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9"
      />
    </div>
  );
}
