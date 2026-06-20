# 🍻 Buzzed

App móvil **privada** para tu cuadrilla: una especie de "Strava de salir de
fiesta". Registra consumiciones, lleva tus estadísticas y (en próximas fases)
organiza eventos, equipos y un feed social con fotos.

> **Fase actual: 1 (MVP)** — Auth + perfil + registro de consumiciones +
> estadísticas personales + APK funcionando. Ver [Roadmap](#-roadmap).

---

## 🎨 Identidad

- **Plataforma:** Android (APK instalable, sin pasar por Play Store).
- **Paleta:** azul claro (`#38BDF8`, acento) · negro (`#0A0A0B`, fondos) ·
  blanco (texto). Los tokens viven en [`src/theme/colors.ts`](src/theme/colors.ts).
- **Tono:** divertido, social, de cuadrilla. UI oscura con buen contraste.

## 🧱 Stack

| Capa            | Tecnología                                            |
| --------------- | ----------------------------------------------------- |
| Frontend        | Expo (React Native) + TypeScript                      |
| Navegación      | `expo-router` (file-based)                            |
| Backend / datos | Supabase (Auth, Postgres, Storage, Realtime)          |
| Estado / caché  | React Query (TanStack Query)                          |
| Empaquetado     | EAS Build → **APK**                                   |

> **Por qué `expo-router`:** el prompt permitía `expo-router` o React
> Navigation. Se eligió `expo-router` por el enrutado basado en ficheros
> (carpeta `app/`), que simplifica el "gate" de auth y la navegación por grupos.

---

## ✅ Requisitos

- **Node.js 18+** y **npm**.
- App **Expo Go** en tu móvil (para desarrollo) o un emulador Android.
- Una cuenta de **Supabase** (gratis) → https://supabase.com
- Para generar la APK: una cuenta de **Expo** y la CLI de **EAS**
  (`npm install -g eas-cli`).

---

## 🚀 Puesta en marcha (desarrollo)

### 1. Instala dependencias

```bash
npm install
```

> Los iconos/splash son placeholders generados; puedes regenerarlos con
> `node scripts/gen-assets.js` o sustituir los PNG de `assets/` por los tuyos.

### 2. Configura Supabase

1. Crea un proyecto nuevo en [Supabase](https://supabase.com).
2. En el **SQL Editor**, ejecuta el contenido de
   [`supabase/migrations/0001_phase1_init.sql`](supabase/migrations/0001_phase1_init.sql).
   Esto crea las tablas (`profiles`, `drink_types`, `consumption_logs`), activa
   **Row Level Security**, crea el trigger que genera el perfil al registrarse y
   siembra el catálogo de bebidas.
3. (Opcional, recomendado para pruebas rápidas) En **Authentication →
   Providers → Email**, desactiva *"Confirm email"* para poder entrar sin
   confirmar el correo.
4. Copia tus claves: **Settings → API → Project URL** y **anon public key**.

### 3. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus claves:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

> Estas claves son **públicas** (van en el cliente). La seguridad real la da
> **RLS** en Supabase, no ocultarlas.

### 4. Arranca

```bash
npm start          # abre el panel de Expo (escanea el QR con Expo Go)
# o directamente:
npm run android    # abre en emulador/dispositivo Android
```

Comprobaciones útiles:

```bash
npm run typecheck  # TypeScript sin emitir
```

---

## 📦 Generar la APK con EAS

La APK permite repartir el archivo entre amigos sin pasar por la Play Store.
La configuración de perfiles está en [`eas.json`](eas.json) (todos generan
**APK**, no AAB).

```bash
# 1. Instala la CLI de EAS (una vez)
npm install -g eas-cli

# 2. Inicia sesión con tu cuenta de Expo
eas login

# 3. Vincula el proyecto (rellena extra.eas.projectId en app.json)
eas init

# 4. Genera la APK (perfil "preview")
eas build -p android --profile preview
```

Al terminar, EAS te da una **URL de descarga** del `.apk`. Descárgalo y
compártelo con tu cuadrilla. En cada móvil hay que permitir *"Instalar apps de
orígenes desconocidos"* para instalarlo.

> Las variables `EXPO_PUBLIC_*` deben estar disponibles en el entorno de build.
> En EAS puedes definirlas con `eas env` o en `eas.json` (campo `env` de cada
> perfil) para que se incrustren en la build.

---

## 🗂️ Estructura del proyecto

```
app/                      # Rutas (expo-router)
  _layout.tsx             # Providers globales + gate de auth
  (auth)/                 # Onboarding, login, registro (+ gate +18)
  (tabs)/                 # Registrar · Stats · Perfil
src/
  components/             # Button, TextField, Card, DrinkChip, BarChart...
  context/AuthProvider    # Sesión de Supabase en contexto
  hooks/                  # useConsumptions, useDrinkTypes, useProfile
  lib/                    # supabase, queryClient, stats
  theme/colors.ts         # Tokens de marca
  types/database.ts       # Tipos de la BD
supabase/migrations/      # SQL con esquema + RLS + seed
scripts/gen-assets.js     # Genera icono/splash placeholder
```

---

## 🔒 Privacidad y seguridad

- App **privada**: cada usuario solo ve sus propios registros gracias a **RLS**.
- Sesión persistida de forma cifrada con `expo-secure-store`.
- **Gate +18** en el registro (fecha de nacimiento + confirmación).
- Avisos de **consumo responsable** repartidos por la app sin estorbar.

> **Principio de producto:** las estadísticas son un **registro informativo**,
> no un marcador competitivo. No hay ranking ni trofeos por "quien más bebe".

---

## 🗺️ Roadmap

- [x] **Fase 1 (MVP):** Auth + perfil + registro de consumiciones +
      estadísticas personales + APK.
- [ ] **Fase 2:** Amigos + feed con fotos (likes/comentarios).
- [ ] **Fase 3:** Eventos (públicos/privados) + equipos/parejas/tríos + stats
      por evento.
- [ ] **Fase 4:** Pulido de UI/marca, gráficas, rendimiento y notificaciones.

---

Hecho con cariño para la cuadrilla. Bebe con cabeza. 🍻
