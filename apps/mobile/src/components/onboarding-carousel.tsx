import AsyncStorage from '@react-native-async-storage/async-storage';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, type ViewToken } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

const STORAGE_KEY = 'epde-mobile-onboarding-done';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🏠',
    title: 'Tu casa tiene un puntaje',
    body: 'El ISV mide el estado de tu vivienda de 0 a 100. Sube cuando completás tareas a tiempo y baja cuando se vencen.',
  },
  {
    emoji: '✅',
    title: 'Tareas organizadas',
    body: 'Tenés un plan de mantenimiento con todo lo que tu casa necesita. Te avisamos cuando algo está por vencer.',
  },
  {
    emoji: '🔔',
    title: 'Recordatorios automáticos',
    body: 'Te llegan notificaciones y emails cuando hay tareas pendientes. No necesitás acordarte de nada.',
  },
  {
    emoji: '📋',
    title: 'Servicios y presupuestos',
    body: 'Si algo necesita intervención profesional, pedilo desde la app. EPDE cotiza y coordina todo.',
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

export const OnboardingCarousel = memo(function OnboardingCarousel() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

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
      AsyncStorage.setItem(STORAGE_KEY, 'true');
      setVisible(false);
    }
  }, [activeIndex]);

  const handleSkip = useCallback(() => {
    haptics.light();
    AsyncStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  if (!visible) return null;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View className="bg-background absolute inset-0 z-50 justify-between pt-20 pb-12">
      {/* Skip */}
      <View className="items-end px-6">
        <Pressable accessibilityRole="button" accessibilityLabel="Saltar tour" onPress={handleSkip}>
          <Text style={TYPE.labelLg} className="text-muted-foreground">
            Saltar
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
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Dots + button */}
      <View className="items-center gap-6 px-6">
        {/* Dots */}
        <View className="flex-row gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className="h-2 rounded-full"
              style={{
                width: i === activeIndex ? 24 : 8,
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
          className="w-full items-center rounded-xl py-4"
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
