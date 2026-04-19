import type { PropertyPublic } from '@epde/shared';
import { QUERY_KEYS } from '@epde/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useProperties, useProperty } from '@/hooks/use-properties';
import { getProperty } from '@/lib/api/properties';
import { useType } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';
import { useSelectedPropertyStore } from '@/stores/selected-property-store';

/**
 * Quick switch entre propiedades del cliente (persona Jorge, inversor
 * con 2-3 propiedades). Sticky en el home, solo se renderiza cuando el
 * cliente tiene >1 propiedad — con una sola propiedad el picker es
 * ruido.
 *
 * UX decisions:
 * - Solo id persistido en Zustand; la data viene de React Query.
 * - Modal sheet-like para la lista en vez de dropdown — más usable en
 *   pantallas chicas y con Dynamic Type alto (Norma).
 * - Al cambiar, prefetcheamos la property con `getProperty(newId)` para
 *   que Detalle abra instantáneo al navegar.
 * - Fallback automático a la primera propiedad si el id guardado ya no
 *   existe (propiedad borrada o cambio de cuenta).
 * - Íconos como emoji/caracteres Unicode porque el mobile no tiene
 *   dependencia de lucide-react-native ni @expo/vector-icons (el resto
 *   de la app usa el mismo patrón — ver AnimatedTabIcon).
 */
export function PropertyPicker() {
  const TYPE = useType();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: propertiesData } = useProperties();
  const selectedId = useSelectedPropertyStore((s) => s.selectedPropertyId);
  const setSelectedId = useSelectedPropertyStore((s) => s.setSelectedPropertyId);

  const properties = useMemo<PropertyPublic[]>(
    () => propertiesData?.pages.flatMap((p) => p.data) ?? [],
    [propertiesData],
  );

  // Resolve selected: id guardado → primera propiedad si id ya no existe.
  const resolved = useMemo(() => {
    if (selectedId) {
      const found = properties.find((p) => p.id === selectedId);
      if (found) return found;
    }
    return properties[0] ?? null;
  }, [properties, selectedId]);

  // Auto-corregir el store cuando el id guardado no existe o está vacío.
  useEffect(() => {
    if (resolved && resolved.id !== selectedId) {
      setSelectedId(resolved.id);
    }
  }, [resolved, selectedId, setSelectedId]);

  // Prefetch la propiedad seleccionada para que el detalle abra sin spinner.
  // useProperty se deshabilita automáticamente con id = '' (enabled: !!id).
  useProperty(resolved?.id ?? '');

  if (properties.length <= 1 || !resolved) return null;

  const handleSelect = (id: string) => {
    haptics.selection();
    setSelectedId(id);
    setOpen(false);
    // Prefetch la nueva propiedad en background.
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.properties, id],
      queryFn: ({ signal }) => getProperty(id, signal).then((r) => r.data),
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Propiedad actual: ${resolved.address}. Tocá para cambiar.`}
        onPress={() => {
          haptics.light();
          setOpen(true);
        }}
        className="bg-muted/50 border-border mb-3 flex-row items-center gap-2 rounded-lg border px-3 py-2.5"
        style={{ minHeight: 44 }}
      >
        <Text style={TYPE.titleMd} aria-hidden>
          🏠
        </Text>
        <View className="min-w-0 flex-1">
          <Text style={TYPE.labelSm} className="text-muted-foreground">
            Propiedad actual
          </Text>
          <Text
            style={TYPE.labelLg}
            className="text-foreground"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {resolved.address}
          </Text>
        </View>
        <Text style={TYPE.titleSm} className="text-muted-foreground" aria-hidden>
          ▾
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 items-center justify-center bg-black/50 p-6"
          accessibilityLabel="Cerrar selector de propiedad"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-2xl p-4"
          >
            <Text style={TYPE.titleSm} className="text-foreground mb-3">
              Elegí una propiedad
            </Text>
            <ScrollView className="max-h-96">
              {properties.map((prop) => {
                const isActive = prop.id === resolved.id;
                return (
                  <Pressable
                    key={prop.id}
                    onPress={() => handleSelect(prop.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${prop.address}${isActive ? ' (seleccionada)' : ''}`}
                    accessibilityState={{ selected: isActive }}
                    style={{ minHeight: 56 }}
                    className={`mb-1 flex-row items-center gap-3 rounded-lg px-3 py-3 ${
                      isActive ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Text style={TYPE.titleMd} aria-hidden>
                      🏠
                    </Text>
                    <View className="min-w-0 flex-1">
                      <Text style={TYPE.labelLg} className="text-foreground" numberOfLines={1}>
                        {prop.address}
                      </Text>
                      <Text style={TYPE.bodySm} className="text-muted-foreground" numberOfLines={1}>
                        {prop.city}
                      </Text>
                    </View>
                    {isActive && (
                      <Text style={TYPE.titleSm} className="text-primary" aria-hidden>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
