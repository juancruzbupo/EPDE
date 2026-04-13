'use client';

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
}

/**
 * Labeled Select input with optional color-dot indicators per option.
 * Used by forms that pick one value from an enum-like `labels` map.
 *
 * The component is controlled — parent owns the value. No react-hook-form
 * coupling so it can be used with plain useState or with Controller.
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
}: LabelSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
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
