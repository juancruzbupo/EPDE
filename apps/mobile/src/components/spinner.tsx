import { ActivityIndicator, type ActivityIndicatorProps, View } from 'react-native';

interface SpinnerProps extends ActivityIndicatorProps {
  /**
   * Qué se está cargando, para lectores de pantalla. Default "Cargando".
   * Contextualizá ("Cargando presupuestos", "Subiendo foto") para que
   * VoiceOver/TalkBack anuncien algo útil.
   */
  label?: string;
}

/**
 * Wrapper de ActivityIndicator con anuncio accesible. El `<View>` recibe
 * role="progressbar" + aria-live="polite" (Android liveRegion) para que
 * screen readers digan "Cargando" cuando aparece, en lugar de dejar al
 * usuario mirando un hueco silencioso.
 *
 * Uso: reemplazá `<ActivityIndicator />` por `<Spinner />` y agregá
 * `label` si el contexto no queda claro.
 */
export function Spinner({ label = 'Cargando', ...props }: SpinnerProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator {...props} />
    </View>
  );
}
