import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  createServiceRequest,
  getServiceRequest,
  getServiceRequests,
  type ServiceRequestFilters,
} from '@/lib/api/service-requests';
import { invalidateClientDashboard } from '@/lib/invalidate-dashboard';

/** Mobile is CLIENT-only — filters default to {} (no admin filtering needed). Web requires filters explicitly. */
export function useServiceRequests(filters: Omit<ServiceRequestFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.serviceRequests, filters],
    queryFn: ({ pageParam, signal }) =>
      getServiceRequests({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

export function useServiceRequest(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.serviceRequests, id],
    queryFn: ({ signal }) => getServiceRequest(id, signal).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.serviceRequests] });
      invalidateClientDashboard(queryClient);
      Alert.alert('Éxito', 'Solicitud creada correctamente');
    },
    onError: (err) => {
      Alert.alert('Error', getErrorMessage(err, 'Error al crear solicitud'));
    },
  });
}
