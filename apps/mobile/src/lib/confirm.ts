/**
 * Fire-and-forget confirmation dialog emitter.
 *
 * Paired with `<ConfirmHost />` mounted at the root of the app layout.
 * Replaces `Alert.alert` for destructive / credential / irreversible
 * actions — re-ux-audit flagged that `Alert.alert` with an "OK" button is
 * ambiguous to older users ("¿OK = sí confirmo? ¿OK = entendido?"). This
 * API forces the caller to label both buttons explicitly so the action
 * is clear from the button text alone.
 *
 * Informational `Alert.alert` (one-button acknowledgements, offline
 * warnings, etc.) can stay as-is — that pattern isn't ambiguous.
 *
 * Pattern mirrors toast.ts — no library dep, no react context, a flat
 * set of listeners. The host subscribes on mount.
 *
 * Usage:
 *   const ok = await confirm({
 *     title: 'Cerrar sesión',
 *     message: '¿Seguro que querés cerrar sesión?',
 *     confirmLabel: 'Sí, cerrar sesión',
 *     cancelLabel: 'Cancelar',
 *     destructive: true,
 *   });
 *   if (ok) logout();
 */

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Button text for the confirm action — be specific ("Eliminar tarea", not "OK"). */
  confirmLabel: string;
  /** Button text for the cancel action — default "Cancelar". */
  cancelLabel?: string;
  /** When true, renders the confirm button in destructive (red) style. */
  destructive?: boolean;
}

export interface ConfirmEvent extends ConfirmOptions {
  id: string;
  resolve: (confirmed: boolean) => void;
}

type Listener = (event: ConfirmEvent) => void;
const listeners = new Set<Listener>();

let counter = 0;
function nextId(): string {
  counter += 1;
  return `c-${Date.now()}-${counter}`;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Ask the user to confirm an action. Resolves to `true` if they pressed
 * the confirm button, `false` if they cancelled (or tapped outside, or
 * hit the system back button).
 *
 * If no `<ConfirmHost />` is mounted (e.g. tests, early boot), resolves
 * to `false` immediately so call sites fail safe.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (listeners.size === 0) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    const event: ConfirmEvent = {
      id: nextId(),
      ...options,
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      resolve,
    };
    listeners.forEach((fn) => fn(event));
  });
}
