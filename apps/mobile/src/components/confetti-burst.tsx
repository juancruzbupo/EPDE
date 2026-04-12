import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export interface ConfettiBurstRef {
  fire: () => void;
}

/**
 * Fullscreen confetti overlay. Render once in a screen layout and call `ref.fire()`.
 * pointer-events: none so it doesn't block interaction.
 */
export const ConfettiBurst = forwardRef<ConfettiBurstRef>(function ConfettiBurst(_props, ref) {
  const cannonRef = useRef<ConfettiCannon>(null);
  const [show, setShow] = useState(false);

  useImperativeHandle(ref, () => ({
    fire: () => {
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    },
  }));

  if (!show) return null;

  return (
    <ConfettiCannon
      ref={cannonRef}
      count={60}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart
      explosionSpeed={300}
      fallSpeed={2500}
      colors={['#C4704B', '#e8ddd3', '#4ade80', '#facc15', '#60a5fa']}
      autoStartDelay={0}
    />
  );
});

export const confettiStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 9999,
  },
});
