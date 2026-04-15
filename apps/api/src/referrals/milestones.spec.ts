import { computeReward, computeRewardDelta, getMilestoneProgress, hasReward } from './milestones';

describe('milestones.computeReward', () => {
  it.each([
    [0, { months: 0, annualDiagnosis: 0, biannualDiagnosis: 0 }],
    [1, { months: 1, annualDiagnosis: 0, biannualDiagnosis: 0 }],
    [2, { months: 2, annualDiagnosis: 0, biannualDiagnosis: 0 }],
    [3, { months: 3, annualDiagnosis: 1, biannualDiagnosis: 0 }],
    [4, { months: 3, annualDiagnosis: 1, biannualDiagnosis: 0 }],
    [5, { months: 6, annualDiagnosis: 1, biannualDiagnosis: 0 }],
    [7, { months: 6, annualDiagnosis: 1, biannualDiagnosis: 0 }],
    [9, { months: 6, annualDiagnosis: 1, biannualDiagnosis: 0 }],
    [10, { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 }],
    [11, { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 }],
    [50, { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 }],
  ])('computeReward(%i) returns %o', (count, expected) => {
    expect(computeReward(count)).toEqual(expected);
  });

  it('caps at milestone 10 (biannual replaces annual)', () => {
    const reward10 = computeReward(10);
    expect(reward10.annualDiagnosis).toBe(0);
    expect(reward10.biannualDiagnosis).toBe(1);
  });
});

describe('milestones.getMilestoneProgress', () => {
  it.each([
    [0, { currentMilestone: 0, nextMilestone: 1 }],
    [1, { currentMilestone: 1, nextMilestone: 2 }],
    [2, { currentMilestone: 2, nextMilestone: 3 }],
    [4, { currentMilestone: 3, nextMilestone: 5 }],
    [5, { currentMilestone: 5, nextMilestone: 10 }],
    [9, { currentMilestone: 5, nextMilestone: 10 }],
    [10, { currentMilestone: 10, nextMilestone: null }],
    [15, { currentMilestone: 10, nextMilestone: null }],
  ])('getMilestoneProgress(%i) returns %o', (count, expected) => {
    expect(getMilestoneProgress(count)).toEqual(expected);
  });
});

describe('milestones.computeRewardDelta', () => {
  it('subtracts previous from next, clamped to 0', () => {
    const prev = { months: 2, annualDiagnosis: 0, biannualDiagnosis: 0 };
    const next = { months: 3, annualDiagnosis: 1, biannualDiagnosis: 0 };
    expect(computeRewardDelta(prev, next)).toEqual({
      months: 1,
      annualDiagnosis: 1,
      biannualDiagnosis: 0,
    });
  });

  it('is zero when no progression', () => {
    const same = { months: 3, annualDiagnosis: 1, biannualDiagnosis: 0 };
    const delta = computeRewardDelta(same, same);
    expect(hasReward(delta)).toBe(false);
  });

  it('handles the biannual-replaces-annual transition at milestone 10', () => {
    const prev = { months: 6, annualDiagnosis: 1, biannualDiagnosis: 0 };
    const next = { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 };
    expect(computeRewardDelta(prev, next)).toEqual({
      months: 6,
      annualDiagnosis: 0, // clamped — annual went 1→0, no negative
      biannualDiagnosis: 1,
    });
  });
});
