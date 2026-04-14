/**
 * Lightweight fire-and-forget toast emitter for mobile.
 *
 * Paired with `<ToastHost />` mounted at the root of the app layout. Keeping
 * the API surface tiny (success/error/info) intentionally — complex interactive
 * affordances (actions, dismiss buttons) still belong in Alert.alert or a
 * sheet, because their UX is blocking by design. Toasts here are for passive
 * confirmations only.
 *
 * Pattern mirrors confetti-event.ts — no library dep, no React context, a flat
 * Set of listeners. The host subscribes on mount and maps incoming events
 * onto its own animated queue.
 */

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastEvent {
  id: string;
  variant: ToastVariant;
  message: string;
  /** Milliseconds before auto-dismiss. Default 3000. */
  duration?: number;
}

type Listener = (event: ToastEvent) => void;
const listeners = new Set<Listener>();

let counter = 0;
function nextId(): string {
  counter += 1;
  return `t-${Date.now()}-${counter}`;
}

function emit(variant: ToastVariant, message: string, duration?: number) {
  const event: ToastEvent = { id: nextId(), variant, message, duration };
  listeners.forEach((fn) => fn(event));
}

export const toast = {
  success: (message: string, duration?: number) => emit('success', message, duration),
  error: (message: string, duration?: number) => emit('error', message, duration),
  info: (message: string, duration?: number) => emit('info', message, duration),
};

export const toastEvent = {
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
