import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';

import { useReferrals } from '@/hooks/use-referrals';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';

/**
 * Read-only referral program card for the mobile profile tab. Mirrors the
 * web surface at apps/web/src/app/(dashboard)/profile/referrals-section.tsx
 * but trimmed: no milestone stepper, no history list, no how-it-works
 * explainer — mobile is for the quick "share my code" reflex. Full detail
 * lives on web.
 *
 * Admin conversion lives on web only (see ADR-010), so no mutation hooks
 * are imported here.
 */
export function ReferralsCard() {
  const { data, isLoading, error } = useReferrals();

  if (isLoading) {
    return (
      <View className="border-border bg-card mb-4 items-center rounded-xl border p-4">
        <Text style={TYPE.titleSm} className="text-foreground mb-2 self-start">
          Programa de recomendación
        </Text>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="border-border bg-card mb-4 rounded-xl border p-4">
        <Text style={TYPE.titleSm} className="text-foreground mb-2">
          Programa de recomendación
        </Text>
        <Text style={TYPE.bodyMd} className="text-muted-foreground">
          No pudimos cargar tu código. Intentá de nuevo en unos minutos.
        </Text>
      </View>
    );
  }

  const { referralCode, referralUrl, stats } = data;
  const { totalReferrals, convertedCount, creditsEarned, nextMilestone } = stats;

  async function handleShare() {
    try {
      const message =
        `Te recomiendo EPDE, un servicio de diagnóstico preventivo para tu casa. ` +
        `Si te sumás con mi código ${referralCode} tenés 10% de descuento. ${referralUrl}`;
      await Share.share({ message });
      haptics.success();
    } catch {
      toast.error('No pudimos abrir el menú de compartir.');
    }
  }

  const hint =
    nextMilestone === null
      ? '¡Llegaste al hito máximo! Seguimos sumando meses por cada nueva conversión.'
      : `Te falta${nextMilestone - convertedCount === 1 ? '' : 'n'} ${
          nextMilestone - convertedCount
        } conversion${nextMilestone - convertedCount === 1 ? '' : 'es'} para el próximo hito.`;

  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <Text style={TYPE.titleSm} className="text-foreground mb-3">
        Programa de recomendación
      </Text>

      <Text style={TYPE.bodySm} className="text-muted-foreground">
        Tu código
      </Text>
      <Text
        style={TYPE.numberLg}
        className="text-primary mb-3 font-mono tracking-wider"
        accessibilityLabel={`Tu código de recomendación es ${referralCode}`}
        selectable
      >
        {referralCode}
      </Text>

      <Pressable
        onPress={handleShare}
        className="bg-primary mb-4 items-center rounded-xl py-3"
        accessibilityRole="button"
        accessibilityLabel="Compartir código de recomendación"
        style={{ minHeight: 44 }}
      >
        <Text style={TYPE.titleSm} className="text-primary-foreground">
          Compartir código
        </Text>
      </Pressable>

      <View className="mb-3 flex-row gap-2">
        <Stat label="Recomendaciones" value={totalReferrals} />
        <Stat label="Conversiones" value={convertedCount} />
        <Stat label="Meses ganados" value={creditsEarned.months} />
      </View>

      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {hint}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="border-border bg-background flex-1 rounded-lg border p-2">
      <Text style={TYPE.bodySm} className="text-muted-foreground">
        {label}
      </Text>
      <Text style={TYPE.numberLg} className="text-foreground mt-1">
        {value}
      </Text>
    </View>
  );
}
