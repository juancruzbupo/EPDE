'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

export function FilterSelect({ value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="w-full sm:w-[200px]"
        aria-label={`Filtrar por ${placeholder.toLowerCase()}`}
      >
        <SelectValue>
          {value === 'all' ? placeholder : (options.find((o) => o.value === value)?.label ?? value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}: Todos</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
