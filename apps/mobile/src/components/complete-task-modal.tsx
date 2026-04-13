import type {
  ActionTaken,
  ConditionFound,
  TaskExecutor,
  TaskPublic,
  TaskResult,
  TaskType,
} from '@epde/shared';
import { CONDITION_TO_DEFAULT_RESULT, TASK_TYPE_TO_DEFAULT_ACTION } from '@epde/shared';
import { parse } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCompleteTask } from '@/hooks/use-task-operations';
import { useUploadFile } from '@/hooks/use-upload';
import { useSlideIn } from '@/lib/animations';
import { TYPE } from '@/lib/fonts';
import { haptics } from '@/lib/haptics';

import { CompletionFindingsForm } from './task/completion-findings-form';
import { CompletionPhotoSection } from './task/completion-photo-section';

interface CompleteTaskModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskPublic;
  planId: string;
  onProblemDetected?: () => void;
}

export function CompleteTaskModal({
  visible,
  onClose,
  task,
  planId,
  onProblemDetected,
}: CompleteTaskModalProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = useSlideIn('bottom');
  const [result, setResult] = useState<TaskResult | null>(null);
  const [conditionFound, setConditionFound] = useState<ConditionFound | null>(null);
  const [executor, setExecutor] = useState<TaskExecutor | null>('OWNER');
  const [actionTaken, setActionTaken] = useState<ActionTaken | null>(
    TASK_TYPE_TO_DEFAULT_ACTION[task.taskType as TaskType] ?? null,
  );
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [completedAtText, setCompletedAtText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const completeTask = useCompleteTask({
    onProblemDetected: onProblemDetected ? () => onProblemDetected() : undefined,
  });
  const uploadFile = useUploadFile();

  const isUploading = uploadFile.isPending;
  const uploadFailed = uploadFile.isError;
  const isSubmitting = completeTask.isPending;
  const canSubmit = !!result && !!conditionFound && !!executor && !!actionTaken;

  /** Auto-infer result from conditionFound in quick mode. */
  const handleConditionChange = useCallback(
    (condition: ConditionFound) => {
      setConditionFound(condition);
      // Only auto-set if user hasn't manually picked a result
      if (!result) {
        setResult(CONDITION_TO_DEFAULT_RESULT[condition]);
      }
    },
    [result],
  );

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
    setFormKey((k) => k + 1);
  };

  const pickImage = () => {
    Alert.alert('Subir foto', 'Elegir origen', [
      {
        text: 'Cámara',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
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
        text: 'Galería',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la galería.');
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
      accessibilityViewIsModal={true}
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
            Registrar Inspección
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirmar completacion"
            onPress={handleSubmit}
            disabled={
              !canSubmit || isSubmitting || isUploading || (photoUri !== null && !uploadedUrl)
            }
            style={{
              opacity:
                !canSubmit || isSubmitting || isUploading || (photoUri !== null && !uploadedUrl)
                  ? 0.4
                  : 1,
            }}
            accessibilityState={{
              disabled:
                !canSubmit || isSubmitting || isUploading || (photoUri !== null && !uploadedUrl),
            }}
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
            Registrá lo observado durante la inspección.
          </Text>

          <CompletionFindingsForm
            key={formKey}
            result={result}
            onResultChange={setResult}
            conditionFound={conditionFound}
            onConditionFoundChange={handleConditionChange}
            executor={executor}
            onExecutorChange={setExecutor}
            actionTaken={actionTaken}
            onActionTakenChange={setActionTaken}
            cost={cost}
            onCostChange={setCost}
            completedAtText={completedAtText}
            onCompletedAtTextChange={setCompletedAtText}
            note={note}
            onNoteChange={setNote}
          />

          <CompletionPhotoSection
            photoUri={photoUri}
            uploadedUrl={uploadedUrl}
            isUploading={isUploading}
            uploadFailed={uploadFailed}
            onPickImage={pickImage}
            onRetryUpload={retryUpload}
            onRemovePhoto={removePhoto}
          />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
