/**
 * Tokens de color de la marca Buzzed.
 *
 * Paleta:
 *  - Azul claro  -> acento / primario (botones, enlaces, datos destacados)
 *  - Negro        -> fondos y superficies
 *  - Blanco       -> texto y contraste
 *
 * Usar SIEMPRE estos tokens en lugar de literales hex para mantener
 * consistencia y poder ajustar la marca en un único sitio.
 */
export const colors = {
  // Acento / primario (azul claro)
  primary: '#38BDF8', // azul claro principal
  primaryDark: '#0EA5E9', // estados pulsados
  primarySoft: 'rgba(56, 189, 248, 0.14)', // fondos sutiles con tinte azul

  // Fondos y superficies (negro)
  background: '#0A0A0B', // fondo base de la app
  surface: '#161618', // tarjetas / paneles
  surfaceAlt: '#1F1F23', // superficies elevadas / inputs
  border: '#2A2A30', // bordes sutiles

  // Texto y contraste (blanco)
  text: '#FFFFFF', // texto principal
  textMuted: '#A1A1AA', // texto secundario
  textFaint: '#6B7280', // texto terciario / placeholders

  // Estados semánticos
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  // Utilidades
  overlay: 'rgba(0, 0, 0, 0.6)',
  transparent: 'transparent',
} as const;

/** Espaciados base (sistema de 4px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Radios de borde. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Tamaños tipográficos. */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

/**
 * Familias tipográficas de marca (Inter).
 *
 * Se aplican a titulares y UI destacada para un look moderno. En Android cada
 * peso es una familia con nombre propio (Inter no responde a fontWeight), por
 * eso se referencian por nombre explícito. El texto de cuerpo usa la fuente del
 * sistema, que ya es legible y rápida.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type ColorToken = keyof typeof colors;
