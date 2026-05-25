# Gestion de Eventos Comunitarios

![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)

Aplicacion movil multiplataforma para que una comunidad local **publique,
descubra y participe en eventos**: vecinos, grupos estudiantiles y juntas
culturales pueden crear eventos, abrir RSVP, comentar, calificar y compartir.

---

## Integrantes del equipo

| Nombres | Apellidos | Carné |
|---------|-----------|-------|
| Diego Guillermo | Esnard Romero | ER231474 |
| Eduardo Ezequiel | López Rivera | LR230061 |
| Diego René | López Martínez | LM231893 |
| Christian Gustavo | Crespín Lozano | CL060107 |
| Andrés René | Velásquez Rodríguez | VR222732 |

---

## Tabla de contenidos

1. [Stack](#stack)
2. [Arquitectura](#arquitectura)
3. [Requisitos previos](#requisitos-previos)
4. [Instalacion](#instalacion)
5. [Configuracion de Firebase](#configuracion-de-firebase)
6. [Configuracion de Google Sign-In](#configuracion-de-google-sign-in)
7. [Ejecucion](#ejecucion)
8. [Modelo de datos](#modelo-de-datos)
9. [Guia de usuario](#guia-de-usuario)
10. [Trabajo colaborativo](#trabajo-colaborativo)
11. [Licencia](#licencia)

---

## Stack

| Capa           | Tecnologia                                              |
| -------------- | ------------------------------------------------------- |
| Framework      | React Native 0.81 + Expo SDK 54                         |
| Lenguaje       | TypeScript en modo `strict` (prohibido `any`)           |
| Enrutamiento   | Expo Router (file-based)                                |
| Estado         | Zustand (un store por dominio)                          |
| Backend        | Firebase Authentication + Cloud Firestore               |
| Auth social    | `expo-auth-session` (Google)                            |
| Notificaciones | `expo-notifications` (recordatorios locales)            |
| UI             | StyleSheet nativo + tokens centralizados ("Void" theme) |
| Iconos         | `lucide-react-native`                                   |

## Arquitectura

```
src/
  modules/        Modulos por dominio (auth, events, rsvps, interactions, history)
    <dominio>/
      components/ UI presentacional
      screens/    Contenedores que orquestan stores
      stores/     Zustand: estado y acciones del dominio
      services/   UNICO lugar con SDK de Firebase
      hooks/      Logica reutilizable del dominio
      types/      Interfaces del dominio
  shared/         Recursos transversales
    components/   UI base (Button, Input, Screen, etc.)
    theme/        Tokens: colors, spacing, typography, radii
    utils/        firebase, validators, formatters, errorHandler, logger
    types/        Tipos compartidos (Firestore, navegacion, AsyncResult)
    hooks/        Hooks compartidos
    stores/       Stores transversales (permisos de notificacion)
app/              Expo Router (rutas)
android/          Codigo nativo Android (generado por `expo prebuild`)
scripts/          Scripts de utilidad (emulador, seed)
firestore.rules   Reglas de seguridad de Firestore
firestore.indexes.json  Indices compuestos requeridos
```

### Reglas estructurales

1. Solo `services/` importa de `firebase/*`. Los stores llaman a services;
   las screens consumen stores via hooks.
2. Los componentes UI son **presentacionales**: reciben props, emiten
   callbacks; no contienen logica de negocio ni llamadas a la base de datos.
3. Manejo de errores **centralizado** en `src/shared/utils/errorHandler.ts`.
   Nunca se muestran stack traces al usuario.
4. **Estetica Void**: fondo `#000000`, cero sombras (`shadowColor`,
   `elevation`), jerarquia visual basada en tipografia y contraste.

## Requisitos previos

- Node.js 20+ y npm
- Android Studio con Android SDK y al menos un AVD (el script asume
  `Pixel_4` por defecto; se puede sobreescribir, ver [Ejecucion](#ejecucion))
- Cuenta de Firebase
- Cuenta de Google Cloud (para OAuth)
- Windows 10/11 (los scripts asumen PowerShell). Para builds nativas con
  rutas largas, habilitar `LongPathsEnabled` en el registro y
  `git config --global core.longpaths true`.

## Instalacion

```powershell
git clone <url-del-repo>
cd proyecto2_dps
npm install
```

## Configuracion de Firebase

1. Crear un proyecto en https://console.firebase.google.com
2. Habilitar **Authentication**:
   - Metodo "Email/Password"
   - Metodo "Google" (registrar el SHA-1 del debug keystore)
3. Crear una base de datos **Cloud Firestore** (modo produccion).
4. Desplegar reglas e indices:
   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use <project-id>
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. Copiar las credenciales del proyecto a `app.json` -> `expo.extra`:
   - `firebaseApiKey`
   - `firebaseAuthDomain`
   - `firebaseProjectId`
   - `firebaseStorageBucket`
   - `firebaseMessagingSenderId`
   - `firebaseAppId`

## Configuracion de Google Sign-In

1. En Google Cloud Console, crear credenciales OAuth 2.0 para:
   - **Web client ID** (necesario aun para Android via `expo-auth-session`)
   - **Android client ID** con `com.geventos.app` como package name y
     el SHA-1 del debug keystore.
2. Pegar los IDs en `app.json` -> `expo.extra`:
   - `googleWebClientId`
   - `googleAndroidClientId`
3. Obtener el SHA-1 del debug keystore:
   ```powershell
   keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

## Ejecucion

```powershell
# Levantar el emulador Android con DNS forzado y sin snapshot
# (por defecto: -Avd Pixel_4 -Scale 0.5)
npm run emulator

# Sobreescribir AVD o escala:
npm run emulator -- -Avd Pixel_6a -Scale 0.4

# En otra terminal, iniciar Expo (solo bundler JS)
npm start

# Build nativa (necesaria para Google Sign-In en Android)
npm run android
```

Comandos utiles:

- `npm run typecheck` — verifica el tipado estricto (unica verificacion
  automatizada del proyecto; no hay tests)
- `npm run format` — aplica Prettier

## Modelo de datos

### Colecciones

- `users/{uid}` — perfil basico, push token, ultima sesion.
- `events/{eventId}` — datos del evento, contadores denormalizados.
  - `events/{eventId}/rsvps/{uid}` — confirmacion de un usuario.
  - `events/{eventId}/comments/{commentId}` — comentarios.
  - `events/{eventId}/ratings/{uid}` — calificaciones de 1 a 5 estrellas.

### Contadores

Los campos `attendeesCount`, `averageRating` y `ratingsCount` del evento
se mantienen consistentes mediante `runTransaction` en los services
correspondientes (`rsvpsService`, `ratingsService`).

## Guia de usuario

1. **Registro** con correo y contraseña, o "Continuar con Google".
2. **Explorar eventos** en la pestana principal: listado de proximos.
3. **Crear evento** (icono +): titulo, descripcion, fecha/hora, ubicacion,
   categoria, capacidad opcional.
4. **Detalle**: ver organizador, RSVP (asistire / tal vez / no asistire),
   comentarios, compartir por correo/redes.
5. **Mis RSVP**: lista de eventos confirmados con recordatorio 1h antes.
6. **Historial**: eventos pasados, estadisticas personales y por categoria.
7. **Perfil**: cerrar sesion, datos personales, totales.

## Trabajo colaborativo

- Rama por modulo y autor: `feature/<modulo>-<descripcion>-<iniciales>`.
- Toda PR pasa por la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`.
- No se hace merge sin `npm run typecheck` en verde.

## Licencia

Este proyecto se distribuye bajo la licencia
**Creative Commons Atribucion-NoComercial-CompartirIgual 4.0 Internacional**
(CC BY-NC-SA 4.0). Ver el archivo [`LICENSE`](./LICENSE) para el resumen y
enlaces al texto legal canonico:
<https://creativecommons.org/licenses/by-nc-sa/4.0/>.
