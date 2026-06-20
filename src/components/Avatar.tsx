/**
 * Avatar circular: muestra la imagen del usuario o su inicial como respaldo.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, fontSize } from '@/theme/colors';

interface AvatarProps {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ username, avatarUrl, size = 40 }: AvatarProps) {
  const initial = (username ?? '?').charAt(0).toUpperCase();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={[styles.image, dimension]} />;
  }

  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceAlt,
  },
  fallback: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  initial: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: fontSize.md,
  },
});
