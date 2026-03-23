'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FADE_IN_UP, MOTION_DURATION, useMotionPreference } from '@/lib/motion';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  total?: number;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  onRowHover?: (row: TData) => void;
  caption?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  total,
  emptyMessage = 'Sin resultados',
  onRowClick,
  onRowHover,
  caption,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { shouldAnimate } = useMotionPreference();

  return (
    <div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <SkeletonShimmer className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  className={
                    onRowClick
                      ? 'hover:bg-muted/50 cursor-pointer transition-opacity active:opacity-60'
                      : undefined
                  }
                  onClick={() => onRowClick?.(row.original)}
                  onMouseEnter={() => onRowHover?.(row.original)}
                  {...(onRowClick
                    ? {
                        tabIndex: 0,
                        role: 'button' as const,
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        },
                      }
                    : {})}
                  initial={shouldAnimate ? { opacity: 0, y: 4 } : false}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  transition={
                    shouldAnimate
                      ? { duration: MOTION_DURATION.normal, delay: index * 0.03 }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <motion.span
                    role="status"
                    variants={FADE_IN_UP}
                    initial={shouldAnimate ? 'hidden' : false}
                    animate={shouldAnimate ? 'visible' : undefined}
                  >
                    {emptyMessage}
                  </motion.span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        {total !== undefined && (
          <p className="text-muted-foreground text-sm">
            {data.length} de {total} resultados
          </p>
        )}
        {hasMore && onLoadMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            aria-label="Cargar más resultados"
          >
            Cargar más
          </Button>
        )}
      </div>
    </div>
  );
}
