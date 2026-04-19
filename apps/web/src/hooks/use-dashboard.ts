import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import {
  getAdminAnalytics,
  getClientAnalytics,
  getClientDashboardStats,
  getClientUpcomingTasks,
  getDashboardActivity,
  getDashboardFinancial,
  getDashboardOperational,
  getDashboardPortfolio,
  getDashboardStats,
} from '@/lib/api/dashboard';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardStats],
    queryFn: ({ signal }) => getDashboardStats(signal).then((r) => r.data),
  });
}

export function useAdminActivity() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardActivity],
    queryFn: ({ signal }) => getDashboardActivity(signal).then((r) => r.data),
  });
}

/** Financial pulse — lazy-loaded. Ver ADR-012 + PR-B.4. */
export function useAdminDashboardFinancial() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'financial'],
    queryFn: ({ signal }) => getDashboardFinancial(signal).then((r) => r.data),
    staleTime: 60_000,
  });
}

/** Operativa (inspecciones + profesionales + churn) — lazy-loaded. */
export function useAdminDashboardOperational() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'operational'],
    queryFn: ({ signal }) => getDashboardOperational(signal).then((r) => r.data),
    staleTime: 60_000,
  });
}

/** ISV del portfolio + certificados — lazy-loaded. */
export function useAdminDashboardPortfolio() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, 'portfolio'],
    queryFn: ({ signal }) => getDashboardPortfolio(signal).then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useClientDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientStats],
    queryFn: ({ signal }) => getClientDashboardStats(signal).then((r) => r.data),
  });
}

export function useClientUpcomingTasks() {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientUpcoming],
    queryFn: ({ signal }) => getClientUpcomingTasks(signal).then((r) => r.data),
  });
}

export function useAdminAnalytics(months?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardAnalytics, months],
    queryFn: ({ signal }) => getAdminAnalytics(signal, months).then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled: months != null,
  });
}

export function useClientAnalytics(months?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.dashboard, QUERY_KEYS.dashboardClientAnalytics, months],
    queryFn: ({ signal }) => getClientAnalytics(signal, months).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
