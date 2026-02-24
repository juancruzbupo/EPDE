'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  queryKeys?: string[][];
  className?: string;
}

export function RefreshButton({ queryKeys, className }: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (queryKeys) {
      await Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
    } else {
      await queryClient.invalidateQueries();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      className={cn('md:hidden', className)}
    >
      <RefreshCw className={cn('mr-1 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
      Refrescar
    </Button>
  );
}
