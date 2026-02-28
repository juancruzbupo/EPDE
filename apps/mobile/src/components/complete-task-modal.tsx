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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompleteTask } from '@/hooks/use-maintenance-plans';
import { useUploadFile } from '@/hooks/use-upload';
import {
  TASK_RESULT_LABELS,
  CONDITION_FOUND_LABELS,
  TASK_EXECUTOR_LABELS,
  ACTION_TAKEN_LABELS,
} from '@epde/shared/constants';
import type {
  TaskPublic,
  TaskResult,
  ConditionFound,
  TaskExecutor,
  ActionTaken,
} from '@epde/shared/types';

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
  labels: Record<string, string>;
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-4">
      <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={`rounded-lg border px-3 py-1.5 ${
                selected ? 'bg-primary border-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                style={{ fontFamily: selected ? 'DMSans_700Bold' : 'DMSans_400Regular' }}
                className={`text-xs ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
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

const RESULTS: TaskResult[] = [
  'OK',
  'OK_WITH_OBSERVATIONS',
  'NEEDS_ATTENTION',
  'NEEDS_REPAIR',
  'NEEDS_URGENT_REPAIR',
  'NOT_APPLICABLE',
];
const CONDITIONS: ConditionFound[] = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];
const EXECUTORS: TaskExecutor[] = ['OWNER', 'HIRED_PROFESSIONAL', 'EPDE_PROFESSIONAL'];
const ACTIONS: ActionTaken[] = [
  'INSPECTION_ONLY',
  'CLEANING',
  'MINOR_REPAIR',
  'MAJOR_REPAIR',
  'REPLACEMENT',
  'TREATMENT',
  'SEALING',
  'ADJUSTMENT',
  'FULL_SERVICE',
  'NO_ACTION',
];

export function CompleteTaskModal({ visible, onClose, task, planId }: CompleteTaskModalProps) {
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<TaskResult | null>(null);
  const [conditionFound, setConditionFound] = useState<ConditionFound | null>(null);
  const [executor, setExecutor] = useState<TaskExecutor | null>(null);
  const [actionTaken, setActionTaken] = useState<ActionTaken | null>(null);
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const completeTask = useCompleteTask();
  const uploadFile = useUploadFile();

  const isUploading = uploadFile.isPending;
  const isSubmitting = completeTask.isPending;
  const canSubmit = !!result && !!conditionFound && !!executor && !!actionTaken;

  const resetForm = () => {
    setResult(null);
    setConditionFound(null);
    setExecutor(null);
    setActionTaken(null);
    setNote('');
    setCost('');
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
    if (!canSubmit) return;

    const parsedCost = cost.trim() ? parseFloat(cost) : undefined;

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
        photoUrl: uploadedUrl || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
        onError: () => {
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
            disabled={!canSubmit || isSubmitting || (isUploading && !uploadedUrl)}
          >
            <Text
              style={{ fontFamily: 'DMSans_700Bold' }}
              className={`text-base ${!canSubmit || isSubmitting ? 'text-muted-foreground' : 'text-primary'}`}
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
            Completá los campos requeridos para registrar la tarea.
          </Text>

          <SelectorGroup
            label="Resultado *"
            options={RESULTS}
            labels={TASK_RESULT_LABELS}
            value={result}
            onChange={setResult}
          />

          <SelectorGroup
            label="Condición encontrada *"
            options={CONDITIONS}
            labels={CONDITION_FOUND_LABELS}
            value={conditionFound}
            onChange={setConditionFound}
          />

          <SelectorGroup
            label="Ejecutor *"
            options={EXECUTORS}
            labels={TASK_EXECUTOR_LABELS}
            value={executor}
            onChange={setExecutor}
          />

          <SelectorGroup
            label="Acción realizada *"
            options={ACTIONS}
            labels={ACTION_TAKEN_LABELS}
            value={actionTaken}
            onChange={setActionTaken}
          />

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Costo (opcional)
          </Text>
          <TextInput
            value={cost}
            onChangeText={setCost}
            placeholder="0.00"
            placeholderTextColor="#4a4542"
            keyboardType="decimal-pad"
            style={{ fontFamily: 'DMSans_400Regular' }}
            className="border-border bg-card text-foreground mb-4 rounded-xl border p-3 text-sm"
          />

          <Text style={{ fontFamily: 'DMSans_500Medium' }} className="text-foreground mb-2 text-sm">
            Notas (opcional)
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Describir el trabajo realizado..."
            placeholderTextColor="#4a4542"
            multiline
            maxLength={500}
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
