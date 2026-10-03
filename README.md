# InCleanHome Frontend — Vite + Vue 3

Frontend en **Vue 3 (sin TypeScript) + Vite**, organizado por bounded contexts (mismo patrón
DDD que el backend de la carpeta hermana `backend/`): cada BC tiene su propia carpeta con
`domain/`, `application/`, `infrastructure/` y `presentation/`.

InCleanHome es únicamente un intermediario entre clientes y trabajadoras del hogar — la
plataforma **no procesa pagos**; cualquier monto que se muestre es solo referencial.

## Tecnologías

- Vite
- Vue 3 (Composition API, `<script setup>`)
- JavaScript
- Vue Router
- Pinia
- Axios
- vue-i18n (español / inglés)
- marked (render de Términos y Privacidad desde Markdown)

## Levantar el proyecto

```bash
npm install
npm run dev
```

Levanta en `http://localhost:5173`. El servidor de Vite además hace proxy de `/api` hacia
`http://localhost:5000` (ver `vite.config.js`), así que en desarrollo normalmente no hace falta
tocar nada más para hablar con el backend local.

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto si necesitas apuntar a un backend en otra URL
(por ejemplo, uno desplegado):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Si no se define, `Shared/infrastructure/http/api.client.js` usa `/api` como base (que Vite
redirige al backend local vía el proxy de `vite.config.js` en desarrollo).

## Build de producción

```bash
npm run build   # genera dist/
npm run preview # sirve dist/ localmente para verificar el build
```

---

## Estructura por bounded context

```
src/
├── IAM/                    ← login, registro, 2FA (TOTP), aceptación de términos
├── Profiles/                ← perfil de cliente y de worker, dashboard de worker
├── SearchAndCatalog/         ← búsqueda de trabajadoras con filtros
├── Booking/                  ← reservas 1:1 cliente-worker
├── Events/                   ← eventos con cupo para varias trabajadoras + postulaciones
├── ReviewsAndEvaluation/      ← reseñas
├── Shared/                   ← layouts, api client, i18n, toast store, vistas públicas (Términos/Privacidad)
└── router.js
```

Cada BC replica:

```
<BoundedContext>/
├── domain/model/          ← entidades y value objects (clases planas, sin dependencias de Vue)
├── application/           ← servicios de aplicación (orquestan infra + mapean a entidades de dominio)
├── infrastructure/        ← clientes *.api.js — únicos que importan el apiClient compartido
└── presentation/
    ├── views/
    └── components/
```

Todas las llamadas HTTP pasan por el `apiClient` (axios) de
`Shared/infrastructure/http/api.client.js`, que agrega automáticamente el JWT guardado en
`localStorage` (vía `AuthStorage`) a cada request.

## Autenticación: sesión vs. challenge token

`IAM/application/auth.store.js` (Pinia) mantiene dos cosas distintas:

- **Sesión real** (`user` + `token`): persistida en `localStorage`, se adjunta a todas las
  llamadas vía el interceptor de `apiClient`.
- **Challenge token**: token de vida corta (5 min) emitido por el backend en pasos intermedios
  del login/registro (reaceptar términos, configurar o verificar 2FA). Vive **solo en memoria**
  (nunca en `localStorage`) y se limpia al completar o cancelar el paso.

`IAM/application/authentication.service.js` normaliza la respuesta de cada paso (`login`,
`registerClient`/`registerWorker`, `acceptTerms`) en una de estas formas, y las vistas
simplemente redirigen según cuál llegó:

- `{ requiresTermsAcceptance: true }` → `/accept-terms`
- `{ requires2fa: true }` → `/2fa-verify`
- `{ requires2faSetup: true }` → `/2fa-setup`
- `{ user }` → sesión establecida, redirige al dashboard/búsqueda según el rol

2FA es obligatorio para toda cuenta: ni el login ni el registro devuelven nunca un token de
sesión directamente sin pasar antes por uno de estos tres pasos.

El registro de trabajadora es tan simple como el de cliente — no hay subida de documentos ni
aprobación manual. InCleanHome no verifica antecedentes de las trabajadoras (ver
`docs/terms-v2.md` §6 en el repo backend); esa era una decisión de producto deliberada, no una
limitación técnica.

## Rutas principales

### Públicas

- `/login`, `/register`
- `/accept-terms`, `/2fa-setup`, `/2fa-verify`
- `/terms`, `/privacy`

### Cliente (`/client/...`, layout `ClientLayout.vue`)

- `search`, `worker/:id`, `worker/:id/book`
- `bookings`
- `events`, `events/new`, `events/:id`
- `messages`, `messages/:userId`
- `profile`

### Trabajadora (`/worker/...`, layout `WorkerLayout.vue`)

- `dashboard`, `profile`
- `availability`, `requests`
- `events`, `events/:id`, `applications`
- `reviews`
- `messages`, `messages/:userId`

## i18n

Todos los textos de UI están en `Shared/infrastructure/i18n/i18n.js`, con claves espejadas en
`es` y `en`. Al agregar una vista nueva, agrega sus claves en ambos bloques.
