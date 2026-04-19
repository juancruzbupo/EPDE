import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface UserInfoCardProps {
  name: string | undefined;
  email: string | undefined;
  phone: string | undefined;
  editingField: 'name' | 'phone' | null;
  editValue: string;
  isSaving: boolean;
  onEditValueChange: (text: string) => void;
  onStartEdit: (field: 'name' | 'phone') => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const UserInfoCard = React.memo(function UserInfoCard({
  name,
  email,
  phone,
  editingField,
  editValue,
  isSaving,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: UserInfoCardProps) {
  return (
    <View className="border-border bg-card mb-4 rounded-xl border p-4">
      <View className="mb-4 items-center">
        <View className="bg-primary/10 mb-3 h-20 w-20 items-center justify-center rounded-full">
          <Text style={{ fontSize: 32 }}>{'\u{1F464}'}</Text>
        </View>
        <Text style={TYPE.titleLg} className="text-foreground">
          {name ?? 'Usuario'}
        </Text>
        <Text style={TYPE.bodyMd} className="text-muted-foreground">
          {email ?? ''}
        </Text>
      </View>

      <View className="border-border gap-3 border-t pt-3">
        {/* Name field */}
        <View className="flex-row items-center justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Nombre
          </Text>
          {editingField === 'name' ? (
            <View className="ml-4 flex-1 flex-row items-center gap-2">
              <TextInput
                value={editValue}
                onChangeText={onEditValueChange}
                className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-1.5"
                style={TYPE.bodyMd}
                autoFocus
              />
              <Pressable
                onPress={onSaveEdit}
                disabled={isSaving}
                accessibilityLabel="Guardar"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text style={TYPE.labelMd} className="text-primary">
                  {isSaving ? '...' : 'OK'}
                </Text>
              </Pressable>
              <Pressable
                onPress={onCancelEdit}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text style={TYPE.labelMd} className="text-muted-foreground">
                  X
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => onStartEdit('name')}
              className="flex-row items-center gap-2"
              accessibilityLabel="Editar nombre"
              accessibilityRole="button"
            >
              <Text style={TYPE.labelLg} className="text-foreground">
                {name ?? '-'}
              </Text>
              <Text style={TYPE.labelMd} className="text-primary">
                Editar
              </Text>
            </Pressable>
          )}
        </View>

        {/* Email field (read-only) */}
        <View className="flex-row justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Email
          </Text>
          <Text style={TYPE.labelLg} className="text-foreground">
            {email ?? '-'}
          </Text>
        </View>

        {/* Phone field */}
        <View className="flex-row items-center justify-between">
          <Text style={TYPE.bodyMd} className="text-muted-foreground">
            Teléfono
          </Text>
          {editingField === 'phone' ? (
            <View className="ml-4 flex-1 flex-row items-center gap-2">
              <TextInput
                value={editValue}
                onChangeText={onEditValueChange}
                className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-1.5"
                style={TYPE.bodyMd}
                keyboardType="phone-pad"
                autoFocus
              />
              <Pressable
                onPress={onSaveEdit}
                disabled={isSaving}
                accessibilityLabel="Guardar"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text style={TYPE.labelMd} className="text-primary">
                  {isSaving ? '...' : 'OK'}
                </Text>
              </Pressable>
              <Pressable
                onPress={onCancelEdit}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text style={TYPE.labelMd} className="text-muted-foreground">
                  X
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => onStartEdit('phone')}
              className="flex-row items-center gap-2"
              accessibilityLabel="Editar teléfono"
              accessibilityRole="button"
            >
              <Text style={TYPE.labelLg} className="text-foreground">
                {phone ?? 'No registrado'}
              </Text>
              <Text style={TYPE.labelMd} className="text-primary">
                Editar
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
});
