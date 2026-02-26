import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCompleteTask } from '@/hooks/use-maintenance-plans';
import { useUploadFile } from '@/hooks/use-upload';
import type { TaskPublic } from '@epde/shared/types';

interface CompleteTaskModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskPublic;
  planId: string;
}

export function CompleteTaskModal({ visible, onClose, task, planId }: CompleteTaskModalProps) {
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const completeTask = useCompleteTask();
  const uploadFile = useUploadFile();

  const isUploading = uploadFile.isPending;
  const isSubmitting = completeTask.isPending;

  const pickImage = () => {
    Alert.alert('Subir foto', 'Elegir origen', [
      {
        text: 'Camara',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la camara.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            handleImageSelected(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la galeria.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            handleImageSelected(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleImageSelected = (uri: string) => {
    setPhotoUri(uri);
    uploadFile.mutate(
      { uri, folder: 'task-photos' },
      {
        onSuccess: (url) => setUploadedUrl(url),
        onError: () => {
          setPhotoUri(null);
          setUploadedUrl(null);
          Alert.alert('Error', 'No se pudo subir la foto.');
        },
      },
    );
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setUploadedUrl(null);
  };

  const handleSubmit = () => {
    completeTask.mutate(
      {
        planId,
        taskId: task.id,
        notes: notes.trim() || undefined,
        photoUrl: uploadedUrl || undefined,
      },
      {
        onSuccess: () => {
          setNotes('');
          setPhotoUri(null);
          setUploadedUrl(null);
          onClose();
        },
        onError: () => {
          Alert.alert('Error', 'No se pudo completar la tarea.');
        },
      },
    );
  };

  const handleClose = () => {
    setNotes('');
    setPhotoUri(null);
    setUploadedUrl(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-background flex-1"
      >
        <View className="border-border flex-row items-center justify-between border-b px-4 py-3">
          <Pressable onPress={handleClose}>
            <Text
              style={{ fontFamily: 'DMSans_500Medium' }}
              className="text-muted-foreground text-base"
            >
              Cancelar
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground text-base">
            Completar Tarea
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting || (isUploading && !uploadedUrl)}
          >
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className={`text-base ${isSubmitting ? 'text-muted-foreground' : 'text-primary'}`}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontFamily: 'DMSans_700Bold' }} className="text-foreground mb-1 text-lg">
            {task.name}
          </Text>
          <Text
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="text-muted-foreground mb-4 text-sm"
          >
            Al confirmar, la tarea se marcara como completada.
          </Text>

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Notas (opcional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Describir el trabajo realizado..."
            placeholderTextColor="#4a4542"
            multiline
            maxLength={1000}
            style={{ fontFamily: 'DMSans_400Regular', minHeight: 80, textAlignVertical: 'top' }}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3 text-sm"
          />

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Foto (opcional)
          </Text>
          {photoUri ? (
            <View className="mb-4">
              <View className="relative">
                <Image source={{ uri: photoUri }} className="h-40 w-40 rounded-xl" />
                {isUploading && (
                  <View className="absolute inset-0 h-40 w-40 items-center justify-center rounded-xl bg-black/40">
                    <ActivityIndicator color="white" />
                  </View>
                )}
                <Pressable
                  onPress={removePhoto}
                  className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">X</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              className="border-border mb-4 flex-row items-center gap-2 rounded-xl border border-dashed px-4 py-3"
            >
              <Text
                style={{ fontFamily: 'DMSans_500Medium' }}
                className="text-muted-foreground text-sm"
              >
                Subir foto
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
