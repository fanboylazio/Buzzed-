/**
 * Crear publicación (modal, Fase 2).
 *
 * Permite elegir una foto (cámara o galería), añadir un texto opcional y
 * publicarla. Pide SIEMPRE permiso antes de acceder a cámara/galería.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ResponsibleNote } from '@/components/ResponsibleNote';
import { useCreatePost } from '@/hooks/useFeed';
import { useActiveEvent } from '@/context/ActiveEventProvider';
import { colors, spacing, fontSize, radius } from '@/theme/colors';

export default function NewPostScreen() {
  const router = useRouter();
  const createPost = useCreatePost();
  const { activeEvent } = useActiveEvent();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Si hay un evento activo, la publicación se asocia a él (se puede quitar).
  const [attachToEvent, setAttachToEvent] = useState(true);

  /** Opciones comunes del recorte/calidad de imagen. */
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.7,
  };

  /** Tomar foto con la cámara (pide permiso antes). */
  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso de cámara',
        'Necesitamos acceso a la cámara para hacer la foto. Puedes activarlo en los ajustes.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  /** Elegir foto de la galería (pide permiso antes). */
  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permiso de galería',
        'Necesitamos acceso a tus fotos para elegir una. Puedes activarlo en los ajustes.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handlePublish() {
    setError(null);
    if (!imageUri) {
      setError('Elige una foto para publicar.');
      return;
    }
    try {
      await createPost.mutateAsync({
        localUri: imageUri,
        texto,
        eventId: activeEvent && attachToEvent ? activeEvent.id : null,
      });
      router.back();
    } catch (e) {
      setError('No se pudo publicar. Inténtalo de nuevo.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Cabecera del modal */}
        <View style={styles.modalHeader}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Nueva publicación</Text>
          <View style={{ width: 64 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selector / preview de imagen */}
          {imageUri ? (
            <Pressable onPress={pickFromGallery}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <View style={styles.changeOverlay}>
                <Ionicons name="camera-reverse" size={18} color={colors.text} />
                <Text style={styles.changeText}>Cambiar foto</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.pickerBox}>
              <Ionicons name="image-outline" size={40} color={colors.textFaint} />
              <Text style={styles.pickerHint}>Añade una foto de tu copa o cóctel</Text>
              <View style={styles.pickerActions}>
                <Pressable style={styles.pickerBtn} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color={colors.primary} />
                  <Text style={styles.pickerBtnText}>Cámara</Text>
                </Pressable>
                <Pressable style={styles.pickerBtn} onPress={pickFromGallery}>
                  <Ionicons name="images" size={20} color={colors.primary} />
                  <Text style={styles.pickerBtnText}>Galería</Text>
                </Pressable>
              </View>
            </View>
          )}

          <TextField
            label="Texto (opcional)"
            value={texto}
            onChangeText={setTexto}
            placeholder="¿Qué estás tomando?"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          {/* Asociación a evento activo */}
          {activeEvent ? (
            <Pressable
              style={styles.eventTag}
              onPress={() => setAttachToEvent((v) => !v)}
            >
              <Ionicons
                name={attachToEvent ? 'checkbox' : 'square-outline'}
                size={20}
                color={attachToEvent ? colors.primary : colors.textMuted}
              />
              <Text style={styles.eventTagText}>
                Publicar en el evento «{activeEvent.nombre}»
              </Text>
            </Pressable>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Publicar"
            onPress={handlePublish}
            loading={createPost.isPending}
            disabled={!imageUri}
          />

          <ResponsibleNote />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  cancel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    width: 64,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  scroll: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  changeOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  pickerBox: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pickerHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pickerBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eventTagText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
