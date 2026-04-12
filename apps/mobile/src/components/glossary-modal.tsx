import { GLOSSARY } from '@epde/shared';
import { memo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { TYPE } from '@/lib/fonts';

interface GlossaryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GlossaryModal = memo(function GlossaryModal({ visible, onClose }: GlossaryModalProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? GLOSSARY.filter(
        (e) =>
          e.term.toLowerCase().includes(search.toLowerCase()) ||
          e.aka?.toLowerCase().includes(search.toLowerCase()) ||
          e.definition.toLowerCase().includes(search.toLowerCase()),
      )
    : GLOSSARY;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="bg-background flex-1 px-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text style={TYPE.titleLg} className="text-foreground">
            Glosario
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Text style={TYPE.bodyLg} className="text-primary">
              Cerrar
            </Text>
          </Pressable>
        </View>
        <Text style={TYPE.bodySm} className="text-muted-foreground mb-3">
          Términos que usamos en EPDE explicados de forma simple.
        </Text>
        <TextInput
          className="border-border bg-muted/30 mb-3 rounded-lg border px-3 py-2 text-sm"
          placeholder="Buscar término..."
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Buscar en el glosario"
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.term}
          ItemSeparatorComponent={() => <View className="border-border border-b" />}
          renderItem={({ item }) => (
            <View className="py-3">
              <Text style={TYPE.labelMd} className="text-foreground">
                {item.term}
                {item.aka ? (
                  <Text style={TYPE.bodySm} className="text-muted-foreground">
                    {' '}
                    ({item.aka})
                  </Text>
                ) : null}
              </Text>
              <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 leading-5">
                {item.definition}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={TYPE.bodySm} className="text-muted-foreground py-8 text-center">
              No se encontraron términos para &quot;{search}&quot;
            </Text>
          }
        />
      </View>
    </Modal>
  );
});
