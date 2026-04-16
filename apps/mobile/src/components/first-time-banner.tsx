import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useType } from '@/lib/fonts';

const STORAGE_PREFIX = 'epde-first-time-banner-';

interface FirstTimeBannerProps {
  /** Stable id — must be unique per banner. Used as AsyncStorage key suffix. */
  id: string;
  title: string;
  message: string;
  /** Optional emoji / icon to give the banner a friendly face. 1 char. */
  emoji?: string;
}

/**
 * One-shot contextual helper card for a screen. Shows on first visit,
 * persists dismissal forever under `AsyncStorage` key
 * `epde-first-time-banner-<id>`. Re-ux-audit flagged that mobile has no
 * step-by-step tour equivalent to web's data-tour pattern — overlay
 * tooltips are hostile on small screens. Inline banners anchored to the
 * screen they explain are the better trade-off: visible when it matters,
 * gone once dismissed, no hidden gesture required.
 *
 * Use sparingly — only on screens where a user could legitimately be
 * confused about what they're looking at. If you find yourself reaching
 * for a second banner on the same screen, the screen probably needs to
 * explain itself better through copy or structure.
 *
 * To reset all banners (QA / manual re-test), clear AsyncStorage keys
 * matching the `epde-first-time-banner-` prefix.
 */
export function FirstTimeBanner({ id, title, message, emoji }: FirstTimeBannerProps) {
  const TYPE = useType();
  // `null` = loading (don't render yet). Avoids flash when user already
  // dismissed; AsyncStorage is async so the state resolves post-mount.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_PREFIX + id)
      .then((value) => {
        if (!cancelled) setVisible(value !== 'dismissed');
      })
      .catch(() => {
        if (!cancelled) setVisible(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function dismiss() {
    setVisible(false);
    AsyncStorage.setItem(STORAGE_PREFIX + id, 'dismissed').catch(() => {});
  }

  if (visible !== true) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      className="bg-primary/10 border-primary/30 mb-4 flex-row items-start gap-3 rounded-xl border p-3"
    >
      {emoji && (
        <Text style={TYPE.titleLg} aria-hidden>
          {emoji}
        </Text>
      )}
      <View className="flex-1">
        <Text style={TYPE.titleSm} className="text-foreground mb-1">
          {title}
        </Text>
        <Text style={TYPE.bodySm} className="text-muted-foreground leading-snug">
          {message}
        </Text>
      </View>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Entendido, ocultar este aviso"
        hitSlop={12}
        className="shrink-0"
      >
        <Text style={TYPE.titleMd} className="text-muted-foreground">
          ×
        </Text>
      </Pressable>
    </View>
  );
}
