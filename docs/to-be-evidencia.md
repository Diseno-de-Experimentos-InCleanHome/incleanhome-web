# Evidencia de las mejoras To-Be (web)

Una entrada por historia de usuario. Los hashes corresponden a los commits de la rama indicada.
Las pruebas usan un API simulado: no llaman a ningún servidor.

## Cómo preparar las capturas

1. Levantar la web con `npm run dev`. Para usar un backend distinto de `http://localhost:5000`,
   definir `VITE_DEV_PROXY_TARGET` en `.env.local` (no se versiona).
2. Encender o apagar un experimento, con una de estas opciones:
   - **Backend local** (no afecta a ningún ambiente compartido): iniciar la API con
     `Experiments__EC_BLQ06__Enabled=true` y `Experiments__EC_BLQ06__TreatmentPercent=100`
     (cambiando el identificador según la historia).
   - **Solo en este navegador**: en las herramientas de desarrollo de Chrome, usar
     "Override content" sobre la respuesta de `/api/experiments/config` y poner `enabled: true`
     y `treatmentPercent: 100`.
3. La variante asignada a cada usuario se conserva en `localStorage`
   (`inclean_variant.<experimento>.<usuario>`). Si un usuario ya quedó en control, borrar esa
   clave y recargar para que se calcule de nuevo.
4. Recargar la página después de cambiar la configuración: se consulta al iniciar la app.

## US43 — Activar las funcionalidades experimentales por configuración

| Dato | Valor |
|---|---|
| Rama | `feature/us43-activar-experimentos` |
| Commits | `5ca78cd` chore(web): permite configurar el destino del proxy de desarrollo con VITE_DEV_PROXY_TARGET<br>`6a0b134` feat(web): US43 activa los experimentos por configuración del API<br>`6a85048` test(web): US43 pruebas de asignación, configuración y caché |
| Pantallas afectadas | Ninguna: es la infraestructura que usan US34, US38 y US41 |
| Endpoint | `GET /api/experiments/config` |

### Comportamiento

- La configuración se pide al iniciar la app (límite de 10 s). Las vistas no esperan por ella.
- Si el API falla, tarda demasiado o responde con otra forma, se usa la última configuración
  válida guardada en el navegador; si no hay ninguna, todo queda apagado.
- `bucket` = primeros 4 bytes (big-endian, sin signo) de `SHA-256("<experimentId>:<userId>")`
  módulo 100; tratamiento si `bucket < treatmentPercent`. Los vectores de prueba son los mismos
  que usa el backend.
- Pruebas A/B (BLQ01, BLQ02, BLQ03, BLQ06): solo clientes. BLQ04 se activa por periodo para
  cualquier visitante y BLQ01-SA para todo prestador/a, sin mirar el porcentaje (igual que en
  la app móvil).
- La primera variante calculada con la configuración ya cargada se conserva por usuario y
  navegador, aunque cambie el porcentaje. El API no guarda variantes: si baja el porcentaje,
  sus eventos de servidor pueden asignar control a un usuario que la web mantiene en tratamiento.
- Apagar un experimento restablece el comportamiento actual sin borrar la variante guardada.

### Pruebas

- `tests/experiments-core.spec.js` (22): SHA-256, vectores de asignación, reglas de evaluación y
  lectura de la configuración.
- `tests/experiments-store.spec.js` (11): carga, caché, valor por defecto, persistencia de la
  variante y composable.
- Resultado: `npm test` 113/113 (80 anteriores + 33 de US43); `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Apagado | Pestaña Network con `GET /api/experiments/config` y los experimentos en `enabled: false`, junto a `/client/search` sin cambios |
| Encendido | La misma petición con `EC-BLQ06` en `enabled: true` y, en Application → Local Storage, las claves `inclean_experiments_config` e `inclean_variant.EC-BLQ06.<usuario>` (la segunda aparece al abrir la reserva, con US41) |
| API caído | Detener el backend y recargar: la web sigue funcionando |

## US42 — Registrar los eventos del plan de tracking

| Dato | Valor |
|---|---|
| Rama | `feature/us42-tracking-eventos` |
| Commits | `bc4439f` feat(web): US42 registra y envía los eventos del plan de tracking<br>`0d1bd55` feat(web): US42 instrumenta búsqueda, perfil, reseñas y reserva<br>`8debc51` test(web): US42 pruebas de privacidad, envío y eventos de las pantallas |
| Pantallas afectadas | `/client/search`, `/client/worker/:id`, `/client/worker/:id/book` y `/client/bookings` (sin cambios visibles) |
| Endpoint | `POST /api/tracking/events` |

### Eventos que envía la web

| Evento | Cuándo | Propiedades | Experimento |
|---|---|---|---|
| `worker_search_performed` | El cliente cambia o limpia filtros (tras 800 ms sin cambios o al salir). El listado inicial no cuenta | `searchId`, `searchMode`, `serviceCategory`, `district`, `filtersApplied`, `resultsCount` | — |
| `worker_profile_viewed` | Carga del perfil | `workerId`, `platform` | `EC-BLQ02` |
| `worker_reviews_viewed` | Carga de las reseñas del perfil | `workerId`, `reviewCount` | `EC-BLQ02` |
| `booking_form_opened` | Carga del formulario de reserva | `workerId`, `platform`, `formId` | `EC-BLQ06` |
| `booking_request_created` | El API confirma la reserva | `bookingId`, `serviceCategory`, `status`, `formId`, `registeredAmount`, `capturedBy` | `EC-BLQ06` |
| `booking_request_failed` | El API rechaza la reserva o no responde | `errorType`, `platform`, `formId`, `capturedBy` | `EC-BLQ06` |
| `review_submitted` | El API confirma la reseña | `bookingId`, `rating`, `isVerified`, `source`, `capturedBy` | — |
| `experiment_exposure` | Se conecta en US41 y US34 | `location` | el expuesto |
| `faq_viewed`, `faq_resolved` | Se conectan en US38 | `category`, `faqId` | `EC-BLQ04` |

- Propiedades comunes: `eventId`, `occurredAt`, `platform: "web"`, `environment`, `userRole`,
  `userRef` (la misma referencia seudónima de la app móvil) y `sessionId`; durante un
  experimento, `experimentId`, `variant` y `featureActive`. Con el experimento apagado esos tres
  van en `null`, igual que en la app móvil y el API.
- `capturedBy: "client"` va en los eventos cuyo plan lo admite; en los demás el API lo descartaría.
- La web no envía `booking_status_changed`, `availability_updated` ni `message_sent`: los
  registra el API.
- `errorType` es `http_<estado>`, `network` o `unexpected`. El API no devuelve su código interno
  (`invalid_duration`, `hours_mismatch`, `service_not_offered`) en la respuesta: lo registra él.
- `review_submitted` no lleva experimento: la web no implementa el recordatorio de US35
  (`EC-BLQ03`).

### Cola y envío

- Cola en `localStorage` (`inclean_tracking_outbox`, máximo 1000), envío en lotes de 100 dos
  segundos después de registrar, al iniciar sesión, al recuperar la red y al ocultar la pestaña.
- `202`: se eliminan. `400`: el lote se descarta (reenviarlo daría el mismo resultado). `401`: se
  conservan hasta una sesión nueva. `503`, otros errores o sin red: reintento a los 5 s, 15 s,
  60 s y luego cada 5 min.
- Sin sesión no se envía. Los eventos anónimos salen con la referencia `anonymous:<sesión>` al
  iniciar sesión; como el API no admite un rol vacío, les asigna el rol de esa cuenta.
- Nunca se guardan contraseñas, tokens, direcciones, notas ni comentarios: solo sobreviven las
  propiedades del plan con la forma esperada.

### Pruebas

- `tests/tracking-core.spec.js` (22): catálogo, privacidad, sobre del evento, duplicados,
  lotes y reintentos.
- `tests/tracking-views.spec.js` (12): eventos de las cuatro pantallas y exposición única.
- Resultado: `npm test` 147/147; `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Apagado | Network: `POST /api/tracking/events` con respuesta `202` tras buscar y abrir un perfil; en el cuerpo, `platform: "web"` y `experimentId: null` |
| Encendido (`EC-BLQ06`) | El mismo envío tras reservar: `booking_form_opened` y `booking_request_created` con el mismo `formId`, `experimentId`, `variant` y `featureActive` |
| Sin red | Application → Local Storage → `inclean_tracking_outbox` con eventos pendientes y, al volver la red, la cola vacía |

## US41 — Conocer el monto estimado antes de confirmar la reserva

| Dato | Valor |
|---|---|
| Rama | `feature/us41-monto-estimado` |
| Commits | `baadd55` feat(web): US41 muestra el monto estimado antes de confirmar la reserva<br>`ea1f2f1` test(web): US41 pruebas de duración, redondeo y formulario de reserva |
| Pantalla afectada | `/client/worker/:id/book` |
| Experimento | `EC-BLQ06` (A/B, solo clientes) |
| Endpoint | `POST /api/bookings/estimate` |

### Comportamiento

- Tratamiento: tarjeta "Monto estimado" con tarifa por hora, duración y total, en formato
  `S/ 0.00`, que se recalcula al cambiar el horario, el servicio o la fecha.
- Antes de elegir fecha se calcula en el navegador; con fecha se muestra la respuesta del API. Un
  `400` muestra el motivo sin monto; si el API no responde, queda el cálculo local.
- Control o experimento apagado: la tarjeta "Resumen" de siempre, sin llamadas al estimado.
- En ambos casos las horas salen del horario con 2 decimales y la reserva exige 30 minutos. El
  selector de la web ofrece horas enteras, así que hoy ningún horario válido queda por debajo.
- Diferencia con la app móvil: la app calcula el estimado localmente; la web usa el endpoint. La
  fórmula y el redondeo (medio céntimo al par) son los mismos.
- `booking_estimate_viewed` (`formId`, `estimatedAmount`) una vez por formulario;
  `experiment_exposure` con `location: "booking_form"` una vez por usuario, en ambos grupos;
  `booking_request_created` suma `estimatedAmount` y `amountMatches`.

### Pruebas

- `tests/booking-estimate.spec.js` (31): duración y redondeo con los vectores del backend,
  formateador, panel, eventos y flag apagado o en control.
- Resultado: `npm test` 178/178; `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Encendido (tratamiento) | Formulario con fecha elegida: tarjeta "Monto estimado" con tarifa, duración y total |
| Encendido (tratamiento) | La misma tarjeta tras cambiar la hora de fin, y en Network el `POST /api/bookings/estimate` |
| Apagado | El mismo formulario con la tarjeta "Resumen" |
