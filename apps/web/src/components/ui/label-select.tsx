'use client';

import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LabelSelectProps {
  label: string;
  labels: Record<string, string>;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  /** When provided, links the trigger to the error message via aria-describedby. */
  errorId?: string;
  /** Optional color dot map — renders a colored circle before each label. */
  colorMap?: Record<string, string>;
  /** Optional HelpHint (or any node) rendered inline next to the label. */
  help?: ReactNode;
}

/**
 * Labeled Select input with optional color-dot indicators per option.
 * Used by forms that pick one value from an enum-like `labels` map.
 *
 * The component is controlled — parent owns the value. No react-hook-form
 * coupling so it can be used with plain useState or with Controller.
 *
 * Passing a `help` node (typically a `<HelpHint>`) renders it inline with the
 * label so older / non-technical users can tap the "?" for an explanation
 * without leaving the form.
 */
export function LabelSelect({
  label,
  labels,
  value,
  onChange,
  placeholder,
  required,
  errorId,
  colorMap,
  help,
}: LabelSelectProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {help}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-describedby={errorId}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([val, lab]) => (
            <SelectItem key={val} value={val}>
              {colorMap?.[val] ? (
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${colorMap[val]}`} />
                  {lab}
                </span>
              ) : (
                lab
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
