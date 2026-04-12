type Listener = () => void;
const listeners = new Set<Listener>();

export const confettiEvent = {
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  fire: () => listeners.forEach((fn) => fn()),
};
