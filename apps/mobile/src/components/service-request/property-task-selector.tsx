import type { PropertyPublic, TaskListItem } from '@epde/shared';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';

interface PropertyTaskSelectorProps {
  properties: PropertyPublic[];
  selectedPropertyId: string | undefined;
  onSelectProperty: (id: string) => void;
  propertyError?: string;
  tasks: TaskListItem[];
  selectedTaskId: string | undefined;
  onSelectTask: (id: string | undefined) => void;
}

export const PropertyTaskSelector = React.memo(function PropertyTaskSelector({
  properties,
  selectedPropertyId,
  onSelectProperty,
  propertyError,
  tasks,
  selectedTaskId,
  onSelectTask,
}: PropertyTaskSelectorProps) {
  return (
    <>
      {/* Property selector */}
      <Text style={TYPE.labelLg} className="text-foreground mb-2">
        Propiedad
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 4 }}
      >
        {properties.map((property) => (
          <Pressable
            key={property.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedPropertyId === property.id }}
            accessibilityLabel={`${property.address}, ${property.city}`}
            onPress={() => onSelectProperty(property.id)}
            className={`rounded-xl border px-4 py-3 ${
              selectedPropertyId === property.id
                ? 'bg-primary border-primary'
                : 'border-border bg-card'
            }`}
          >
            <Text
              style={TYPE.labelLg}
              className={
                selectedPropertyId === property.id ? 'text-primary-foreground' : 'text-foreground'
              }
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {property.address}
            </Text>
            <Text
              style={TYPE.bodySm}
              className={
                selectedPropertyId === property.id
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              }
            >
              {property.city}
            </Text>
          </Pressable>
        ))}
        {properties.length === 0 && (
          <View className="py-2">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </ScrollView>
      {propertyError && (
        <Text style={TYPE.bodySm} className="text-destructive mb-2">
          {propertyError}
        </Text>
      )}
      {!propertyError && <View className="mb-4" />}

      {/* Task selector -- shown when property has tasks */}
      {selectedPropertyId && tasks.length > 0 && (
        <>
          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Tarea relacionada (opcional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: !selectedTaskId }}
              accessibilityLabel="Ninguna tarea"
              onPress={() => onSelectTask(undefined)}
              className={`rounded-xl border px-4 py-2 ${
                !selectedTaskId ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                style={TYPE.labelMd}
                className={!selectedTaskId ? 'text-primary-foreground' : 'text-foreground'}
              >
                Ninguna
              </Text>
            </Pressable>
            {tasks.map((task) => (
              <Pressable
                key={task.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedTaskId === task.id }}
                accessibilityLabel={task.name}
                onPress={() => onSelectTask(task.id)}
                className={`rounded-xl border px-4 py-2 ${
                  selectedTaskId === task.id ? 'bg-primary border-primary' : 'border-border bg-card'
                }`}
              >
                <Text
                  style={TYPE.labelMd}
                  className={
                    selectedTaskId === task.id ? 'text-primary-foreground' : 'text-foreground'
                  }
                  ellipsizeMode="tail"
                  numberOfLines={1}
                >
                  {task.name}
                </Text>
                <Text
                  style={TYPE.bodySm}
                  className={
                    selectedTaskId === task.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }
                >
                  {task.category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </>
  );
});
