/**
 * Crear evento (modal, Fase 3).
 *
 * Recoge nombre, descripción, tipo (público/privado) y una fecha de fin
 * opcional. El creador se añade como miembro automáticamente (trigger en BD).
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCreateEvent } from '@/hooks/useEvents';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { EventType } from '@/types/database';

/** Convierte "DD/MM/AAAA" a ISO al final del día, o null si no es válida. */
function parseEndDate(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59);
  if (d.getDate() !== Number(dd) || d.getMonth() !== Number(mm) - 1) return null;
  return d.toISOString();
}

export default function NewEventScreen() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<EventType>('publico');
  const [fechaFin, setFechaFin] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (nombre.trim().length < 2) {
      setError('Ponle un nombre al evento.');
      return;
    }
    let fechaFinIso: string | null = null;
    if (fechaFin.trim()) {
      fechaFinIso = parseEndDate(fechaFin);
      if (!fechaFinIso) {
        setError('La fecha de fin debe ser DD/MM/AAAA.');
        return;
      }
    }
    try {
      const id = await createEvent.mutateAsync({
        nombre,
        descripcion,
        tipo,
        fecha_fin: fechaFinIso,
      });
      // Reemplazamos el modal por el detalle del nuevo evento.
      router.replace(`/event/${id}`);
    } catch {
      setError('No se pudo crear el evento. Inténtalo de nuevo.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.modalHeader}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
          <Text style={styles.modalTitle}>Nuevo evento</Text>
          <View style={{ width: 64 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="ej. San Mateo, Cumple de Álvaro..."
          />
          <TextField
            label="Descripción (opcional)"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿De qué va el evento?"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          {/* Tipo de evento */}
          <View>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.segment}>
              <Pressable
                style={[styles.segmentBtn, tipo === 'publico' && styles.segmentActive]}
                onPress={() => setTipo('publico')}
              >
                <Ionicons
                  name="earth"
                  size={16}
                  color={tipo === 'publico' ? colors.background : colors.text}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipo === 'publico' && styles.segmentTextActive,
                  ]}
                >
                  Público
                </Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, tipo === 'privado' && styles.segmentActive]}
                onPress={() => setTipo('privado')}
              >
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={tipo === 'privado' ? colors.background : colors.text}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipo === 'privado' && styles.segmentTextActive,
                  ]}
                >
                  Privado
                </Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>
              {tipo === 'publico'
                ? 'Cualquiera del grupo puede apuntarse.'
                : 'Solo verán el evento las personas que invites.'}
            </Text>
          </View>

          <TextField
            label="Fecha de fin (opcional)"
            value={fechaFin}
            onChangeText={setFechaFin}
            placeholder="DD/MM/AAAA"
            keyboardType="numbers-and-punctuation"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Crear evento"
            onPress={handleCreate}
            loading={createEvent.isPending}
          />
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.background,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
});
