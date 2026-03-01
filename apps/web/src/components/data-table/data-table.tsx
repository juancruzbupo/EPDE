'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { SkeletonShimmer } from '@/components/ui/skeleton-shimmer';
import { fadeInUp, useMotionPreference, MOTION_DURATION } from '@/lib/motion';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  total?: number;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
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
  caption,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { shouldAnimate } = useMotionPreference();
  const RowWrapper = shouldAnimate ? motion.tr : 'tr';

  return (
    <div>
      <div className="rounded-md border">
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
                <RowWrapper
                  key={row.id}
                  className={onRowClick ? 'hover:bg-muted/50 cursor-pointer' : undefined}
                  onClick={() => onRowClick?.(row.original)}
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
                  {...(shouldAnimate
                    ? {
                        initial: { opacity: 0, y: 4 },
                        animate: { opacity: 1, y: 0 },
                        transition: {
                          duration: MOTION_DURATION.normal,
                          delay: index * 0.03,
                        },
                      }
                    : {})}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </RowWrapper>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {shouldAnimate ? (
                    <motion.span variants={fadeInUp} initial="hidden" animate="visible">
                      {emptyMessage}
                    </motion.span>
                  ) : (
                    emptyMessage
                  )}
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
