# 🍻 Buzzed

App móvil **privada** para tu cuadrilla: una especie de "Strava de salir de
fiesta". Registra consumiciones, lleva tus estadísticas y (en próximas fases)
organiza eventos, equipos y un feed social con fotos.

> **Fase actual: 3** — Eventos (públicos/privados), equipos/parejas/tríos y
> estadísticas por evento como *diario compartido*. Ver [Roadmap](#-roadmap).

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
2. En el **SQL Editor**, ejecuta **en orden** las migraciones de
   [`supabase/migrations/`](supabase/migrations/):
   - `0001_phase1_init.sql`: tablas base (`profiles`, `drink_types`,
     `consumption_logs`), **RLS**, trigger de creación de perfil y seed del
     catálogo de bebidas.
   - `0002_phase2_social.sql`: amistades y feed (`friendships`, `posts`,
     `post_likes`, `post_comments`), su **RLS**, el **bucket privado**
     `post-photos` para las fotos y la activación de **Realtime**.
   - `0003_phase3_events.sql`: eventos y equipos (`events`, `event_members`,
     `teams`, `team_members`), funciones de visibilidad, **RLS**, vinculación de
     consumiciones/posts a eventos (diario compartido) y Realtime.
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
  _layout.tsx             # Providers globales + gate de auth (Stack raíz)
  (auth)/                 # Onboarding, login, registro (+ gate +18)
  (tabs)/                 # Feed · Registrar · Eventos · Stats · Perfil
  post/new.tsx            # Crear publicación (modal, cámara/galería)
  post/[id].tsx           # Detalle de publicación + comentarios
  event/new.tsx           # Crear evento (modal)
  event/[id].tsx          # Detalle: gente, equipos, feed y diario del evento
  friends.tsx             # Buscar/añadir amigos y solicitudes
src/
  components/             # Button, Card, Avatar, PostCard, DrinkChip, BarChart...
  context/                # AuthProvider, ActiveEventProvider
  hooks/                  # useConsumptions, useFeed, useFriends, useEvents, useTeams...
  lib/                    # supabase, queryClient, storage, stats, eventStats, format
  theme/colors.ts         # Tokens de marca
  types/database.ts       # Tipos de la BD
supabase/migrations/      # SQL con esquema + RLS + seed + Storage + Realtime
scripts/gen-assets.js     # Genera icono/splash placeholder
```

---

## 🔒 Privacidad y seguridad

- App **privada**: cada usuario solo ve sus registros, y en el feed solo sus
  publicaciones y las de sus **amigos** (todo impuesto por **RLS**).
- **Fotos en bucket privado** (`post-photos`): se suben a la carpeta del usuario
  y se sirven con **URLs firmadas** temporales; solo el autor y sus amigos
  pueden generarlas. Se pide **permiso de cámara/galería** antes de usarlas.
- **Eventos:** los públicos los ve todo el grupo; los privados, solo sus
  miembros. Las consumiciones y publicaciones **asociadas a un evento** son
  visibles para sus miembros (el *diario compartido*), pero lo personal sigue
  siendo privado.
- Sesión persistida de forma cifrada con `expo-secure-store`.
- **Gate +18** en el registro (fecha de nacimiento + confirmación).
- Avisos de **consumo responsable** repartidos por la app sin estorbar.

> **Principio de producto:** las estadísticas son un **registro informativo**,
> no un marcador competitivo. No hay ranking ni trofeos por "quien más bebe".

---

## 🗺️ Roadmap

- [x] **Fase 1 (MVP):** Auth + perfil + registro de consumiciones +
      estadísticas personales + APK.
- [x] **Fase 2:** Amigos (solicitud/aceptación) + feed con fotos
      (likes/comentarios) en vivo con Realtime.
- [x] **Fase 3:** Eventos (públicos/privados) + equipos/parejas/tríos + stats
      por evento como *diario compartido* (informativo, sin ranking).
- [ ] **Fase 4:** Pulido de UI/marca, gráficas, rendimiento y notificaciones.

---

Hecho con cariño para la cuadrilla. Bebe con cabeza. 🍻
