import type {
  ActionTaken,
  ConditionFound,
  TaskExecutor,
  TaskPublic,
  TaskResult,
} from '@epde/shared';
import {
  ACTION_TAKEN_LABELS,
  ACTION_TAKEN_VALUES,
  CONDITION_FOUND_LABELS,
  CONDITION_FOUND_VALUES,
  TASK_EXECUTOR_LABELS,
  TASK_EXECUTOR_VALUES,
  TASK_RESULT_LABELS,
  TASK_RESULT_VALUES,
} from '@epde/shared';
import { parse } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCompleteTask } from '@/hooks/use-task-operations';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { COLORS } from '@/lib/colors';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

interface CompleteTaskModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskPublic;
  planId: string;
}

function SelectorGroup<T extends string>({
  label,
  options,
  labels,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-4" accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={TYPE.labelLg} className="text-foreground mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={labels[opt] ?? opt}
              onPress={() => onChange(opt)}
              className={`rounded-lg border px-4 py-2.5 ${
                selected ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                style={selected ? TYPE.titleSm : TYPE.bodyMd}
                className={selected ? 'text-primary-foreground' : 'text-foreground'}
              >
                {labels[opt] ?? opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CompleteTaskModal({ visible, onClose, task, planId }: CompleteTaskModalProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = useSlideIn('bottom');
  const [result, setResult] = useState<TaskResult | null>(null);
  const [conditionFound, setConditionFound] = useState<ConditionFound | null>(null);
  const [executor, setExecutor] = useState<TaskExecutor | null>(null);
  const [actionTaken, setActionTaken] = useState<ActionTaken | null>(null);
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [completedAtText, setCompletedAtText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const completeTask = useCompleteTask();
  const uploadFile = useUploadFile();

  const isUploading = uploadFile.isPending;
  const uploadFailed = uploadFile.isError;
  const isSubmitting = completeTask.isPending;
  const canSubmit = !!result && !!conditionFound && !!executor && !!actionTaken;

  const resetForm = () => {
    setResult(null);
    setConditionFound(null);
    setExecutor(null);
    setActionTaken(null);
    setNote('');
    setCost('');
    setCompletedAtText('');
    setPhotoUri(null);
    setUploadedUrl(null);
  };

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
          const res = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]) {
            handleImageSelected(res.assets[0].uri);
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
          const res = await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: true,
          });
          if (!res.canceled && res.assets[0]) {
            handleImageSelected(res.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleImageSelected = (uri: string) => {
    setPhotoUri(uri);
    setUploadedUrl(null);
    uploadFile.mutate(
      { uri, folder: 'task-photos' },
      {
        onSuccess: (url) => setUploadedUrl(url),
        onError: () => {
          Alert.alert('Error', 'No se pudo subir la foto. Podés reintentar o elegir otra.');
        },
      },
    );
  };

  const retryUpload = () => {
    if (!photoUri) return;
    setUploadedUrl(null);
    uploadFile.mutate(
      { uri: photoUri, folder: 'task-photos' },
      {
        onSuccess: (url) => setUploadedUrl(url),
        onError: () => {
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
    if (!canSubmit) return;

    const parsedCost = cost.trim() ? parseFloat(cost) : undefined;
    const completedAt = completedAtText.trim()
      ? parse(completedAtText.trim(), 'dd/MM/yyyy', new Date())
      : undefined;

    completeTask.mutate(
      {
        planId,
        taskId: task.id,
        result,
        conditionFound,
        executor,
        actionTaken,
        note: note.trim() || undefined,
        cost: parsedCost && !isNaN(parsedCost) ? parsedCost : undefined,
        completedAt: completedAt && !isNaN(completedAt.getTime()) ? completedAt : undefined,
        photoUrl: uploadedUrl || undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          resetForm();
          onClose();
        },
        onError: () => {
          haptics.error();
          Alert.alert('Error', 'No se pudo completar la tarea.');
        },
      },
    );
  };

  const isDirty =
    !!result ||
    !!conditionFound ||
    !!executor ||
    !!actionTaken ||
    note.trim().length > 0 ||
    completedAtText.trim().length > 0 ||
    photoUri !== null;

  const handleClose = () => {
    if (isDirty) {
      Alert.alert('Descartar cambios?', 'Tenés cambios sin guardar.', [
        { text: 'Seguir editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            resetForm();
            onClose();
          },
        },
      ]);
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-background flex-1"
      >
        <View
          style={{ paddingTop: insets.top }}
          className="border-border flex-row items-center justify-between border-b px-4 py-3"
        >
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={handleClose}>
            <Text style={TYPE.labelLg} className="text-muted-foreground">
              Cancelar
            </Text>
          </Pressable>
          <Text style={TYPE.titleMd} className="text-foreground">
            Completar Tarea
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar completacion"
            onPress={handleSubmit}
            disabled={
              !canSubmit || isSubmitting || isUploading || (photoUri !== null && !uploadedUrl)
            }
          >
            <Text
              style={TYPE.titleMd}
              className={!canSubmit || isSubmitting ? 'text-muted-foreground' : 'text-primary'}
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </Text>
          </Pressable>
        </View>

        <Animated.ScrollView style={contentStyle} contentContainerStyle={{ padding: 16 }}>
          <Text style={TYPE.titleLg} className="text-foreground mb-1">
            {task.name}
          </Text>
          <Text style={TYPE.bodyMd} className="text-muted-foreground mb-4">
            Completá los campos requeridos para registrar la tarea.
          </Text>

          <SelectorGroup
            label="Resultado *"
            options={TASK_RESULT_VALUES}
            labels={TASK_RESULT_LABELS}
            value={result}
            onChange={setResult}
          />

          <SelectorGroup
            label="Condición encontrada *"
            options={CONDITION_FOUND_VALUES}
            labels={CONDITION_FOUND_LABELS}
            value={conditionFound}
            onChange={setConditionFound}
          />

          <SelectorGroup
            label="Ejecutor *"
            options={TASK_EXECUTOR_VALUES}
            labels={TASK_EXECUTOR_LABELS}
            value={executor}
            onChange={setExecutor}
          />

          <SelectorGroup
            label="Acción realizada *"
            options={ACTION_TAKEN_VALUES}
            labels={ACTION_TAKEN_LABELS}
            value={actionTaken}
            onChange={setActionTaken}
          />

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Costo (opcional)
          </Text>
          <View className="mb-4 flex-row items-center">
            <Text style={TYPE.bodyMd} className="text-muted-foreground mr-2">
              $
            </Text>
            <TextInput
              value={cost}
              onChangeText={setCost}
              placeholder="0.00"
              placeholderTextColor={COLORS.mutedForeground}
              keyboardType="decimal-pad"
              style={TYPE.bodyMd}
              className="border-border bg-card text-foreground flex-1 rounded-xl border p-3"
            />
          </View>

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Fecha de completación (opcional)
          </Text>
          <TextInput
            value={completedAtText}
            onChangeText={setCompletedAtText}
            placeholder="DD/MM/AAAA (hoy por defecto)"
            placeholderTextColor={COLORS.mutedForeground}
            keyboardType="numeric"
            style={TYPE.bodyMd}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3"
          />

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
            Notas (opcional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Describir el trabajo realizado..."
            placeholderTextColor={COLORS.mutedForeground}
            multiline
            maxLength={500}
            style={[TYPE.bodyMd, { minHeight: 80, textAlignVertical: 'top' }]}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3"
          />

          <Text style={TYPE.labelLg} className="text-foreground mb-2">
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
                {uploadFailed && !isUploading && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reintentar subida de foto"
                    onPress={retryUpload}
                    className="absolute inset-0 h-40 w-40 items-center justify-center rounded-xl bg-black/50"
                  >
                    <Text style={TYPE.labelMd} className="text-white">
                      Reintentar
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Eliminar foto"
                  onPress={removePhoto}
                  className="bg-destructive absolute -top-2 -right-2 h-6 w-6 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">X</Text>
                </Pressable>
              </View>
              {isUploading && (
                <Text style={TYPE.bodySm} className="text-muted-foreground mt-1">
                  Subiendo foto...
                </Text>
              )}
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              className="border-border flex-row items-center gap-2 rounded-xl border border-dashed px-4 py-3"
            >
              <Text style={TYPE.labelLg} className="text-muted-foreground">
                Subir foto
              </Text>
            </Pressable>
          )}
          <Text style={TYPE.bodySm} className="text-muted-foreground mt-1 mb-4">
            Máx. 10 MB por archivo
          </Text>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
