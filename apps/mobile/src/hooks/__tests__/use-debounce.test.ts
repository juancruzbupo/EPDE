import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from '../use-debounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial'));
    expect(result.current).toBe('initial');
  });

  it('delays value update until delay passes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('resets timer when value changes during delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    // 400ms total elapsed but only 200ms since last change — still "a"
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });

  it('uses default delay of 300ms when not specified', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    });

    rerender({ value: 'y' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('y');
  });

  it('supports number values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 1 },
    });

    rerender({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });
});
