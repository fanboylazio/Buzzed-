# Buzzed — Prompt para Claude Code

> Pega esto en Claude Code como instrucción inicial del proyecto.

---

Eres un ingeniero full-stack senior. Vas a construir **Buzzed**, una app móvil **privada** para un grupo de amigos, distribuida como **APK de Android**. Es una especie de "Strava de salir de fiesta": registra consumiciones, organiza eventos, agrupa a la gente en equipos y tiene un feed social con fotos.

Trabaja por fases. Empieza montando el esqueleto del proyecto y el MVP (Fase 1) antes de tocar nada avanzado. Antes de decisiones de arquitectura grandes o irreversibles, pregúntame. Escribe código limpio, comentado en español, y deja un README con instrucciones para correr el proyecto y generar la APK.

## 1. Identidad de marca

- **Nombre:** Buzzed
- **Plataforma:** Android (APK instalable, sin pasar por Play Store)
- **Paleta:** azul claro (acento/primario), negro (fondos/superficies), blanco (texto/contraste). Define los tokens de color y úsalos de forma consistente.
- **Tono:** divertido, social, de cuadrilla. Tipografía moderna y legible, UI con buen contraste sobre fondo oscuro.

## 2. Stack recomendado

- **Frontend:** Expo (React Native) + TypeScript. Navegación con `expo-router` o React Navigation.
- **Backend / datos:** Supabase (Auth, Postgres, Storage para fotos, Realtime para el feed y actualizaciones en vivo).
- **Empaquetado:** EAS Build para generar la **APK** (`eas build -p android --profile preview`). Documenta el proceso en el README.
- **Estado/datos:** React Query (TanStack Query) para fetching y caché.

Si propones otro stack equivalente, justifícalo brevemente antes.

## 3. Modelo de datos (Supabase / Postgres)

Define al menos estas entidades (añade campos que veas necesarios):

- **profiles**: id, username, avatar_url, fecha_alta. (Vinculado a auth de Supabase.)
- **friendships**: relación entre usuarios (solicitud/aceptado) para formar el grupo de amigos.
- **events**: id, nombre, descripción, tipo (`publico` | `privado`), fecha_inicio, fecha_fin, creador_id, portada_url. Ej.: "San Mateo" (público), "Cumpleaños de Álvaro" (privado).
- **event_members**: usuario ↔ evento, con rol y referencia a equipo.
- **teams**: id, nombre, evento_id, tipo (`individual` | `pareja` | `trio` | `equipo`). Permite formar equipos, parejas y tríos dentro de un evento.
- **team_members**: usuario ↔ equipo.
- **drink_types**: catálogo: copa, cóctel, cerveza, chupito, cigarro (con icono y, opcionalmente, una unidad de referencia).
- **consumption_logs**: id, usuario_id, evento_id (nullable), drink_type_id, cantidad, timestamp, nota opcional. Es el registro central.
- **posts**: id, autor_id, evento_id (nullable), foto_url, texto, timestamp. Para el feed.
- **post_likes** y **post_comments**: interacción social en el feed.

Activa **Row Level Security** en Supabase para que cada usuario solo vea lo que le corresponde (su grupo, los eventos a los que pertenece, etc.).

## 4. Funcionalidades

### 4.1 Cuenta y amigos
- Registro / login (email o teléfono vía Supabase Auth).
- Perfil con avatar y nombre de usuario.
- Añadir amigos y formar el grupo (solicitud + aceptación).
- **Gate +18** al registrarse (confirmación de mayoría de edad).

### 4.2 Registro de consumiciones (núcleo)
- Botón rápido para registrar una consumición: elegir tipo (copa, cóctel, cerveza, chupito, cigarro), cantidad y, opcionalmente, asociarla a un evento activo.
- Que sea rápido de usar con una mano y de noche: accesos directos grandes, pocos toques.
- Edición/borrado de un registro propio reciente.

### 4.3 Estadísticas e historial
- **Vista personal:** totales por tipo, por noche, por evento; gráfica de evolución; "resumen de la noche".
- **Vista de grupo:** resumen agregado del grupo dentro de un evento (totales por persona y por equipo, como diario compartido del evento). Muestra los datos de forma informativa.
- Historial navegable por fechas y por eventos pasados.

> **Principio de producto:** las vistas comparativas son un registro compartido, no un marcador que premie consumir lo máximo. No implementes un campeonato ni un ranking cuyo criterio de victoria sea "quien más bebe/fuma gana", ni trofeos al mayor consumo. Si más adelante se quiere un componente competitivo, se definirá sobre otra métrica.

### 4.4 Eventos
- **Eventos públicos** (ej. "San Mateo"): cualquiera del grupo se apunta; la gente se une formando equipos (la cuadrilla).
- **Eventos privados/personalizados** (ej. "Cumpleaños de Álvaro"): los crea un usuario e invita; mismo sistema de equipos.
- Dentro de un evento se pueden formar **equipos, parejas y tríos**.
- Pantalla de evento: info, participantes, equipos, feed del evento y estadísticas del evento.

### 4.5 Feed social
- Feed con **fotos** de las copas/cócteles/cigarros, con texto opcional.
- Feed global del grupo y feed filtrado por evento.
- Likes y comentarios.
- Subida de fotos a Supabase Storage; actualización en vivo con Realtime.

## 5. Pantallas (mínimo)

1. Onboarding / Auth (+ gate +18)
2. Home / feed
3. Registro rápido de consumición (modal o pantalla dedicada)
4. Lista de eventos + crear evento
5. Detalle de evento (participantes, equipos, feed y stats del evento)
6. Estadísticas personales e historial
7. Perfil y amigos

## 6. Empaquetado como APK

- Configura `app.json`/`eas.json` para Android.
- Perfil de build que genere una **APK** instalable (no AAB), para repartir el archivo entre amigos.
- README con: requisitos, cómo correr en desarrollo (`expo start`), cómo configurar las claves de Supabase (variables de entorno) y cómo generar la APK con EAS.

## 7. Notas

- App **privada**, solo para el grupo. Mantén los datos protegidos con RLS.
- Avisos breves de consumo responsable donde encajen sin estorbar (p. ej. en el resumen de la noche).
- Pide siempre permiso de cámara/galería antes de usarlas.

## 8. Fases sugeridas

1. **MVP:** Auth + perfil + registro de consumiciones + estadísticas personales + APK funcionando.
2. Amigos + feed con fotos (likes/comentarios).
3. Eventos (públicos y privados) + equipos/parejas/tríos + stats por evento.
4. Pulido de UI/marca, gráficas, rendimiento y notificaciones.

Empieza por la Fase 1. Cuando la tengas montada y corriendo, enséñamela antes de seguir.
