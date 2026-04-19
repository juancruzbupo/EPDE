import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, type ViewToken } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

const STORAGE_KEY = 'epde-mobile-onboarding-done';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🏠',
    title: 'Tu casa tiene un puntaje',
    body: 'El puntaje de tu casa (ISV) mide qué tan bien está, de 0 a 100. Arriba de 60 = está bien. Debajo de 40 = necesita atención. Sube cuando completás tareas a tiempo.',
  },
  {
    emoji: '✅',
    title: 'Tareas organizadas',
    body: 'Tenés un plan de mantenimiento con todo lo que tu casa necesita. Cada tarea tiene prioridad y fecha: Alta = urgente, Media = regular, Baja = cuando puedas.',
  },
  {
    emoji: '👆',
    title: 'Completar es fácil',
    body: 'Para completar una tarea solo indicás en qué estado encontraste todo y quién lo hizo. Tarda menos de 1 minuto.',
  },
  {
    emoji: '🔔',
    title: 'Recordatorios automáticos',
    body: 'Te llegan notificaciones y emails cuando hay tareas pendientes. No necesitás acordarte de nada.',
  },
  {
    emoji: '📋',
    title: 'Servicios y presupuestos',
    body: '¿Algo necesita un profesional? Pedí un servicio o presupuesto desde la app. EPDE cotiza, coordina y te avisa.',
  },
];

function SlideItem({ item }: { item: Slide }) {
  return (
    <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center px-10">
      <Text style={{ fontSize: 64 }} className="mb-6">
        {item.emoji}
      </Text>
      <Text style={TYPE.displaySm} className="text-foreground mb-3 text-center">
        {item.title}
      </Text>
      <Text style={TYPE.bodyMd} className="text-muted-foreground text-center leading-6">
        {item.body}
      </Text>
    </View>
  );
}

/**
 * Hook that checks if onboarding should be shown.
 * Returns [shouldShow, dismiss] — use to conditionally render the carousel
 * instead of the main content to avoid gesture conflicts.
 */
export function useOnboardingState() {
  const [show, setShow] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => setShow(!val));
  }, []);

  const dismiss = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  }, []);

  return [show, dismiss] as const;
}

interface OnboardingCarouselProps {
  onDone: () => void;
}

export const OnboardingCarousel = memo(function OnboardingCarousel({
  onDone,
}: OnboardingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = useCallback(() => {
    haptics.light();
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onDone();
    }
  }, [activeIndex, onDone]);

  const handleSkip = useCallback(() => {
    haptics.light();
    onDone();
  }, [onDone]);

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View className="bg-background flex-1 justify-between pt-20 pb-12">
      {/* Skip */}
      <View className="items-end px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar guía"
          onPress={handleSkip}
          hitSlop={12}
          style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
        >
          <Text style={TYPE.labelLg} className="text-muted-foreground">
            Cerrar
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <SlideItem item={item} />}
        onViewableItemsChanged={handleViewableChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Dots + button */}
      <View className="items-center gap-6 px-6">
        {/* Dots — h-3 (antes h-2) para que sean más fáciles de ver en
            pantallas chicas y con Dynamic Type alto. Label dinámico para
            screen readers. */}
        <View
          className="flex-row gap-2"
          accessibilityRole="progressbar"
          accessibilityLabel={`Paso ${activeIndex + 1} de ${SLIDES.length}`}
          accessibilityValue={{ now: activeIndex + 1, min: 1, max: SLIDES.length }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className="h-3 rounded-full"
              style={{
                width: i === activeIndex ? 28 : 10,
                backgroundColor: i === activeIndex ? COLORS.primary : COLORS.border,
              }}
            />
          ))}
        </View>

        {/* Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Empezar' : 'Siguiente'}
          onPress={handleNext}
          className="w-full items-center rounded-xl py-4 active:opacity-80"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text style={TYPE.titleMd} className="text-white">
            {isLast ? 'Empezar' : 'Siguiente'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

export async function resetMobileOnboarding() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
