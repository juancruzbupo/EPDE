/**
 * Entity factories for tests — shared across API (Jest/ts-jest), web (Vitest)
 * and mobile (Jest/jest-expo). Each factory returns the minimal valid shape
 * for the corresponding public type with sensible defaults, and accepts a
 * partial override for the fields a given test actually cares about.
 *
 * Using these factories instead of inline object literals has three wins:
 *   - Tests stop breaking on unrelated schema additions (add a new required
 *     field → factory gets the default, every caller stays green).
 *   - The factory file is the canonical "what's the shape of a User?" — new
 *     devs don't need to grep Prisma schema.
 *   - Specs shrink: `makeTask({ priority: URGENT })` vs 12 lines of setup.
 *
 * Factories are deterministic when called without overrides (no random IDs,
 * no `new Date()`) — snapshot tests won't flake. If you need variation use
 * an explicit override.
 */
import type {
  BudgetRequestPublic,
  PlanPublic,
  PropertyPublic,
  ReferralHistoryItem,
  ReferralStatePublic,
  TaskDetailPublic,
  TaskLogPublic,
  TaskPublic,
  UserPublic,
} from '../types';

const BASE_DATE = '2026-01-15T12:00:00.000Z';

export function makeUser(overrides: Partial<UserPublic> = {}): UserPublic {
  return {
    id: 'user-1',
    email: 'u1@example.com',
    name: 'Test User',
    phone: null,
    role: 'CLIENT',
    status: 'ACTIVE',
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    deletedAt: null,
    lastLoginAt: null,
    activatedAt: BASE_DATE,
    subscriptionExpiresAt: '2030-01-01T00:00:00.000Z',
    streakFreezeUsedAt: null,
    isvGoal: null,
    ...overrides,
  } as UserPublic;
}

export function makeProperty(overrides: Partial<PropertyPublic> = {}): PropertyPublic {
  return {
    id: 'property-1',
    userId: 'user-1',
    address: 'Calle Falsa 123',
    city: 'CABA',
    propertyType: 'HOUSE',
    type: 'HOUSE',
    yearBuilt: 2010,
    squareMeters: 120,
    activeSectors: ['EXTERIOR', 'INTERIOR'],
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    deletedAt: null,
    ...overrides,
  } as PropertyPublic;
}

export function makePlan(overrides: Partial<PlanPublic> = {}): PlanPublic {
  return {
    id: 'plan-1',
    propertyId: 'property-1',
    name: 'Plan estándar',
    status: 'ACTIVE',
    sourceInspectionId: null,
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  } as PlanPublic;
}

export function makeTask(overrides: Partial<TaskPublic> = {}): TaskPublic {
  return {
    id: 'task-1',
    maintenancePlanId: 'plan-1',
    categoryId: 'category-1',
    name: 'Revisar techo',
    description: null,
    priority: 'MEDIUM',
    recurrenceType: 'ANNUAL',
    recurrenceMonths: 12,
    nextDueDate: BASE_DATE,
    status: 'PENDING',
    taskType: 'INSPECTION',
    professionalRequirement: 'OWNER_CAN_DO',
    technicalDescription: null,
    estimatedDurationMinutes: 30,
    order: 0,
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  } as TaskPublic;
}

export function makeTaskDetail(overrides: Partial<TaskDetailPublic> = {}): TaskDetailPublic {
  return {
    ...makeTask(),
    category: { id: 'category-1', name: 'General', icon: '🏗️' },
    ...overrides,
  } as TaskDetailPublic;
}

export function makeTaskLog(overrides: Partial<TaskLogPublic> = {}): TaskLogPublic {
  return {
    id: 'log-1',
    taskId: 'task-1',
    completedBy: 'user-1',
    completedAt: BASE_DATE,
    result: 'OK',
    conditionFound: 'GOOD',
    executor: 'OWNER',
    actionTaken: 'INSPECTION_ONLY',
    cost: null,
    notes: null,
    photoUrl: null,
    user: { id: 'user-1', name: 'Test User' },
    ...overrides,
  } as TaskLogPublic;
}

export function makeBudgetRequest(
  overrides: Partial<BudgetRequestPublic> = {},
): BudgetRequestPublic {
  return {
    id: 'budget-1',
    propertyId: 'property-1',
    requesterId: 'user-1',
    title: 'Reparación techo',
    description: null,
    status: 'PENDING',
    version: 1,
    createdBy: 'user-1',
    updatedBy: null,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  } as BudgetRequestPublic;
}

export function makeReferral(overrides: Partial<ReferralHistoryItem> = {}): ReferralHistoryItem {
  return {
    id: 'referral-1',
    referredName: null,
    status: 'PENDING',
    createdAt: BASE_DATE,
    convertedAt: null,
    ...overrides,
  } as ReferralHistoryItem;
}

export function makeReferralState(
  overrides: Partial<ReferralStatePublic> = {},
): ReferralStatePublic {
  return {
    referralCode: 'TEST-A7K',
    referralUrl: 'https://epde.com.ar/?ref=TEST-A7K',
    stats: {
      totalReferrals: 0,
      convertedCount: 0,
      currentMilestone: 0,
      nextMilestone: 1,
      creditsEarned: { months: 0, annualDiagnosis: 0, biannualDiagnosis: 0 },
    },
    milestones: [
      { target: 1, reward: '1 mes gratis', reached: false, reachedAt: null },
      { target: 2, reward: '2 meses gratis', reached: false, reachedAt: null },
      { target: 3, reward: '3 meses gratis', reached: false, reachedAt: null },
      { target: 5, reward: '6 meses gratis + diagnóstico anual', reached: false, reachedAt: null },
      {
        target: 10,
        reward: '12 meses gratis + diagnóstico bianual',
        reached: false,
        reachedAt: null,
      },
    ],
    referralHistory: [],
    ...overrides,
  } as ReferralStatePublic;
}
