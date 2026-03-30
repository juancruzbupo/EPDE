import { Image } from 'expo-image';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/collapsible-section';
import { TYPE } from '@/lib/fonts';

/* ── Types ── */
interface ExpenseItem {
  date: string;
  description: string;
  category: string | null;
  sector: string | null;
  amount: number;
  type: 'task' | 'budget';
}

interface BreakdownEntry {
  name: string;
  total: number;
  count: number;
}

export interface ExpenseAnalytics {
  months: number;
  monthlyAvg: number;
  categories: BreakdownEntry[];
  sectors: BreakdownEntry[];
  maxTotal: number;
  maxSectorTotal: number;
}

interface PhotoItem {
  url: string;
  date: string;
  description: string;
  source: 'service-request' | 'task';
}

/* ── Currency formatter ── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);

/* ── Expense Section ── */
interface PropertyExpenseSectionProps {
  totalCost: number;
  items: ExpenseItem[];
  analytics: ExpenseAnalytics;
}

export const PropertyExpenseSection = React.memo(function PropertyExpenseSection({
  totalCost,
  items,
  analytics,
}: PropertyExpenseSectionProps) {
  return (
    <CollapsibleSection title={`Gastos (${formatCurrency(totalCost)})`}>
      <View className="gap-3">
        {/* Preventive savings insight */}
        <View className="bg-success/5 border-success/20 rounded-lg border p-2.5">
          <Text style={TYPE.bodySm} className="text-success">
            El mantenimiento preventivo reduce hasta un 80% el costo de reparaciones mayores.
          </Text>
        </View>
        {/* Stat summary */}
        <View className="flex-row gap-2">
          <View className="bg-muted/40 flex-1 rounded-lg p-2.5">
            <Text style={TYPE.labelMd} className="text-muted-foreground">
              Mensual prom.
            </Text>
            <Text style={TYPE.titleSm} className="text-foreground">
              {formatCurrency(analytics.monthlyAvg)}
            </Text>
          </View>
          <View className="bg-muted/40 flex-1 rounded-lg p-2.5">
            <Text style={TYPE.labelMd} className="text-muted-foreground">
              Per\u00edodo
            </Text>
            <Text style={TYPE.titleSm} className="text-foreground">
              {analytics.months} mes{analytics.months !== 1 ? 'es' : ''}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
        <View className="gap-2">
          {analytics.categories.slice(0, 5).map((cat) => {
            const pct = analytics.maxTotal > 0 ? (cat.total / analytics.maxTotal) * 100 : 0;
            return (
              <View key={cat.name}>
                <View className="flex-row items-center justify-between">
                  <Text style={TYPE.bodySm} className="text-foreground">
                    {cat.name}
                  </Text>
                  <Text style={TYPE.bodySm} className="text-foreground">
                    {formatCurrency(cat.total)}
                  </Text>
                </View>
                <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                  <View className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Sector breakdown */}
        {analytics.sectors.length > 0 && (
          <View className="gap-2">
            <Text style={TYPE.labelMd} className="text-muted-foreground">
              Por sector
            </Text>
            {analytics.sectors.slice(0, 5).map((sec) => {
              const pct =
                analytics.maxSectorTotal > 0 ? (sec.total / analytics.maxSectorTotal) * 100 : 0;
              return (
                <View key={sec.name}>
                  <View className="flex-row items-center justify-between">
                    <Text style={TYPE.bodySm} className="text-foreground">
                      {sec.name}
                    </Text>
                    <Text style={TYPE.bodySm} className="text-foreground">
                      {formatCurrency(sec.total)}
                    </Text>
                  </View>
                  <View className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
                    <View className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Item list */}
        <View className="border-border border-t pt-2">
          <Text style={TYPE.labelMd} className="text-muted-foreground mb-2">
            \u00daltimos movimientos
          </Text>
          {items.slice(0, 5).map((item) => (
            <View
              key={`${item.date}-${item.description}`}
              className="border-border flex-row items-center justify-between border-b py-1.5 last:border-0"
            >
              <View className="flex-1">
                <Text style={TYPE.bodySm} className="text-foreground">
                  {item.description}
                </Text>
                <Text style={TYPE.labelMd} className="text-muted-foreground">
                  {item.category ?? 'Presupuesto'} \u00b7{' '}
                  {new Date(item.date).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={TYPE.titleSm} className="text-foreground">
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </CollapsibleSection>
  );
});

/* ── Photos Section ── */
interface PropertyPhotosSectionProps {
  photos: PhotoItem[];
}

export const PropertyPhotosSection = React.memo(function PropertyPhotosSection({
  photos,
}: PropertyPhotosSectionProps) {
  return (
    <CollapsibleSection title={`Fotos (${photos.length})`}>
      <View className="flex-row flex-wrap gap-2">
        {photos.slice(0, 12).map((photo) => (
          <Pressable
            key={`${photo.url}-${photo.date}`}
            accessibilityRole="button"
            accessibilityLabel="Ver foto"
            onPress={() => Linking.openURL(photo.url)}
            className="overflow-hidden rounded-lg"
          >
            <Image
              source={photo.url}
              contentFit="cover"
              transition={200}
              className="h-24 w-24 rounded-lg"
              accessibilityLabel={photo.description || 'Foto de la propiedad'}
            />
            <View className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5">
              <Text
                style={TYPE.labelSm}
                className="text-center text-white"
                ellipsizeMode="tail"
                numberOfLines={1}
              >
                {photo.source === 'task' ? 'Tarea' : 'Solicitud'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </CollapsibleSection>
  );
});
