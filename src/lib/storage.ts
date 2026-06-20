/**
 * Utilidades de Storage para las fotos del feed.
 *
 * El bucket "post-photos" es PRIVADO: las imágenes se suben a la carpeta del
 * usuario ({autor_id}/...) y se sirven mediante URLs firmadas temporales. Así
 * solo el autor y sus amigos (según RLS) pueden generar la URL de visualización.
 */
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

const BUCKET = 'post-photos';

/**
 * Sube una foto local (uri del image picker) a Storage y devuelve su ruta.
 * @param userId  id del usuario (define la carpeta de destino)
 * @param localUri  uri local del fichero a subir
 */
export async function uploadPostPhoto(
  userId: string,
  localUri: string,
): Promise<string> {
  // Deducimos extensión y tipo MIME a partir de la uri.
  const rawExt = (localUri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0];
  const ext = rawExt === 'png' ? 'png' : 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  // Ruta única dentro de la carpeta del usuario.
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${userId}/${unique}.${ext}`;

  // En React Native leemos el fichero como base64 y lo decodificamos a binario.
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decode(base64);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType, upsert: false });

  if (error) throw error;
  return path;
}

/**
 * Genera URLs firmadas para un conjunto de rutas de Storage.
 * Devuelve un mapa ruta -> URL firmada (omite las que fallen).
 */
export async function signPhotoUrls(
  paths: string[],
  expiresInSeconds = 3600,
): Promise<Record<string, string>> {
  const unique = [...new Set(paths)].filter(Boolean);
  if (unique.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, expiresInSeconds);

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      map[item.path] = item.signedUrl;
    }
  }
  return map;
}

/** Borra una foto del bucket (al eliminar una publicación). */
export async function deletePostPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
