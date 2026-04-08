import { Injectable } from '@nestjs/common';

import { AnalyticsRepository } from './analytics.repository';
import { DashboardStatsRepository } from './dashboard-stats.repository';
import { HealthIndexRepository } from './health-index.repository';

/**
 * Facade that delegates to the 3 focused repositories.
 * Kept for backwards compatibility with DashboardService and external consumers.
 */
@Injectable()
export class DashboardRepository {
  constructor(
    private readonly stats: DashboardStatsRepository,
    private readonly healthIndex: HealthIndexRepository,
    private readonly analytics: AnalyticsRepository,
  ) {}

  // ─── Stats ─────────────────────────────────────────────

  getAdminStats() {
    return this.stats.getAdminStats();
  }

  getRecentActivity() {
    return this.stats.getRecentActivity();
  }

  getClientPropertyAndPlanIds(userId: string) {
    return this.stats.getClientPropertyAndPlanIds(userId);
  }

  getClientTaskStats(planIds: string[], userId: string) {
    return this.stats.getClientTaskStats(planIds, userId);
  }

  getClientBudgetAndServiceCounts(propertyIds: string[]) {
    return this.stats.getClientBudgetAndServiceCounts(propertyIds);
  }

  getClientUpcomingTasks(userId: string) {
    return this.stats.getClientUpcomingTasks(userId);
  }

  // ─── Health Index ──────────────────────────────────────

  getPropertyHealthIndex(planIds: string[]) {
    return this.healthIndex.getPropertyHealthIndex(planIds);
  }

  getPropertyHealthIndexBatch(planIds: string[]) {
    return this.healthIndex.getPropertyHealthIndexBatch(planIds);
  }

  getClientSectorBreakdown(planIds: string[]) {
    return this.healthIndex.getClientSectorBreakdown(planIds);
  }

  getIsvDelta(propertyIds: string[]) {
    return this.healthIndex.getIsvDelta(propertyIds);
  }

  getMaintenanceStreak(planIds: string[]) {
    return this.healthIndex.getMaintenanceStreak(planIds);
  }

  getAnnualSummary(planIds: string[]) {
    return this.healthIndex.getAnnualSummary(planIds);
  }

  getPerfectWeek(planIds: string[]) {
    return this.healthIndex.getPerfectWeek(planIds);
  }

  // ─── Analytics ─────────────────────────────────────────

  getCompletionTrend(months: number) {
    return this.analytics.getCompletionTrend(months);
  }

  getConditionDistribution() {
    return this.analytics.getConditionDistribution();
  }

  getProblematicCategories() {
    return this.analytics.getProblematicCategories();
  }

  getBudgetPipeline() {
    return this.analytics.getBudgetPipeline();
  }

  getProblematicSectors() {
    return this.analytics.getProblematicSectors();
  }

  getCategoryCosts(months: number) {
    return this.analytics.getCategoryCosts(months);
  }

  getAvgBudgetResponseDays() {
    return this.analytics.getAvgBudgetResponseDays();
  }

  getTotalMaintenanceCost() {
    return this.analytics.getTotalMaintenanceCost();
  }

  getCompletionRate() {
    return this.analytics.getCompletionRate();
  }

  getSlaMetrics() {
    return this.analytics.getSlaMetrics();
  }

  getClientConditionTrend(planIds: string[], months: number) {
    return this.analytics.getClientConditionTrend(planIds, months);
  }

  getClientCostHistory(planIds: string[], months: number) {
    return this.analytics.getClientCostHistory(planIds, months);
  }

  getClientConditionDistribution(planIds: string[]) {
    return this.analytics.getClientConditionDistribution(planIds);
  }

  getClientCategoryBreakdown(planIds: string[]) {
    return this.analytics.getClientCategoryBreakdown(planIds);
  }
}
