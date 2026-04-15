import type { ReferralStatePublic } from '@epde/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Share } from 'react-native';

import { ReferralsCard } from '../referrals-card';

const mockUseReferrals = jest.fn();

jest.mock('@/hooks/use-referrals', () => ({
  useReferrals: () => mockUseReferrals(),
}));

jest.mock('@/lib/haptics', () => ({
  haptics: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

function makeState(overrides: Partial<ReferralStatePublic> = {}): ReferralStatePublic {
  return {
    referralCode: 'JUAN-A7K',
    referralUrl: 'https://epde.com.ar/?ref=JUAN-A7K',
    stats: {
      totalReferrals: 4,
      convertedCount: 2,
      currentMilestone: 2,
      nextMilestone: 3,
      creditsEarned: { months: 2, annualDiagnosis: 0, biannualDiagnosis: 0 },
    },
    milestones: [],
    referralHistory: [],
    ...overrides,
  };
}

describe('ReferralsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading indicator while fetching', () => {
    mockUseReferrals.mockReturnValue({ data: undefined, isLoading: true, error: null });
    render(<ReferralsCard />);
    expect(screen.getByText('Programa de recomendación')).toBeTruthy();
  });

  it('renders the fallback copy on error', () => {
    mockUseReferrals.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });
    render(<ReferralsCard />);
    expect(
      screen.getByText('No pudimos cargar tu código. Intentá de nuevo en unos minutos.'),
    ).toBeTruthy();
  });

  it('renders the code, stats and next-milestone hint', () => {
    mockUseReferrals.mockReturnValue({ data: makeState(), isLoading: false, error: null });
    render(<ReferralsCard />);

    expect(screen.getByText('JUAN-A7K')).toBeTruthy();
    expect(screen.getByText('Recomendaciones')).toBeTruthy();
    expect(screen.getByText('Conversiones')).toBeTruthy();
    expect(screen.getByText('Meses ganados')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Te falta 1 conversion para el próximo hito.')).toBeTruthy();
  });

  it('shows the max-milestone copy when nextMilestone is null', () => {
    mockUseReferrals.mockReturnValue({
      data: makeState({
        stats: {
          totalReferrals: 12,
          convertedCount: 10,
          currentMilestone: 10,
          nextMilestone: null,
          creditsEarned: { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 },
        },
      }),
      isLoading: false,
      error: null,
    });
    render(<ReferralsCard />);

    expect(
      screen.getByText(
        '¡Llegaste al hito máximo! Seguimos sumando meses por cada nueva conversión.',
      ),
    ).toBeTruthy();
  });

  it('opens the share sheet with the code + link when the share button is pressed', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    mockUseReferrals.mockReturnValue({ data: makeState(), isLoading: false, error: null });
    render(<ReferralsCard />);

    fireEvent.press(screen.getByLabelText('Compartir código de recomendación'));

    expect(shareSpy).toHaveBeenCalledTimes(1);
    const arg = shareSpy.mock.calls[0]![0] as { message: string };
    expect(arg.message).toContain('JUAN-A7K');
    expect(arg.message).toContain('https://epde.com.ar/?ref=JUAN-A7K');
  });
});
