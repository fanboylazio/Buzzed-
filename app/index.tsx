/**
 * Entrada raíz. El AuthGate del layout decide a dónde ir; mientras tanto
 * redirigimos a las pestañas (si hay sesión) y, si no, el gate manda a auth.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)" />;
}
