import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CollapsibleSection } from '../collapsible-section';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  selectionAsync: jest.fn(),
}));

describe('CollapsibleSection', () => {
  it('renders title text', () => {
    render(
      <CollapsibleSection title="Historial">
        <Text>Content</Text>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Historial')).toBeTruthy();
  });

  it('renders count badge when count is provided', () => {
    render(
      <CollapsibleSection title="Notas" count={5}>
        <Text>Content</Text>
      </CollapsibleSection>,
    );
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('does not render count badge when count is undefined', () => {
    render(
      <CollapsibleSection title="Notas">
        <Text>Content</Text>
      </CollapsibleSection>,
    );
    expect(screen.queryByText('0')).toBeNull();
  });

  it('shows children when defaultOpen is true', () => {
    render(
      <CollapsibleSection title="Section" defaultOpen={true}>
        <Text>Visible content</Text>
      </CollapsibleSection>,
    );
    expect(screen.getByText('Visible content')).toBeTruthy();
  });

  it('hides children when defaultOpen is false', () => {
    render(
      <CollapsibleSection title="Section" defaultOpen={false}>
        <Text>Hidden content</Text>
      </CollapsibleSection>,
    );
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('toggles visibility on press', () => {
    render(
      <CollapsibleSection title="Toggle" defaultOpen={false}>
        <Text>Toggled content</Text>
      </CollapsibleSection>,
    );

    // Initially hidden
    expect(screen.queryByText('Toggled content')).toBeNull();

    // Press to open
    fireEvent.press(screen.getByText('Toggle'));
    expect(screen.getByText('Toggled content')).toBeTruthy();

    // Press to close
    fireEvent.press(screen.getByText('Toggle'));
    expect(screen.queryByText('Toggled content')).toBeNull();
  });
});
