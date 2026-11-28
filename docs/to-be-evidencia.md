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
| `booking_estimate_viewed` | Primera vez que el formulario muestra un monto estimado (US41) | `formId`, `estimatedAmount` | `EC-BLQ06` |
| `experiment_exposure` | Primera vez que el usuario llega al perfil (US34) o a la reserva (US41) con el experimento activo | `location` | `EC-BLQ02`, `EC-BLQ06` |
| `faq_viewed`, `faq_resolved` | Abrir una pregunta o marcarla como resuelta en `/ayuda` (US38) | `category`, `faqId` | `EC-BLQ04` |

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

## US34 — Reseñas verificadas e historial del prestador/a

| Dato | Valor |
|---|---|
| Rama | `feature/us34-resenas-verificadas` |
| Commits | `95809b5` feat(web): US34 valida el comentario obligatorio de la reseña<br>`90a7a2f` feat(web): US34 muestra reseñas verificadas e historial del prestador/a<br>`7d76e2f` test(web): US34 pruebas de reseñas verificadas y comentario obligatorio |
| Pantallas afectadas | `/client/worker/:id`; modal de reseña en `/client/bookings` |
| Experimento | `EC-BLQ02` (A/B, solo clientes) |
| Endpoints | `GET /api/reviews/worker/{id}?sort=&serviceType=`, `GET /api/reviews/worker/{id}/summary` |

### Comportamiento

- Tratamiento: solo reseñas verificadas (como la app móvil), cada una con insignia, tipo de
  servicio y fecha del servicio; promedio con un decimal, distribución de 5 a 1 estrellas,
  servicios completados, orden por fecha y filtro por servicio resueltos por el API. La cabecera
  del perfil usa el mismo resumen.
- Sin reseñas: "Este prestador/a todavía no tiene reseñas verificadas." y los servicios
  completados, sin promedio. Si el API falla: aviso con "Reintentar".
- El texto del campo `message` del resumen no se muestra: llega solo en español.
- Control o experimento apagado: la lista y la cabecera de siempre.
- Modal de reseña (con o sin experimento): comentario obligatorio de 1 a 1000 caracteres, con
  mensaje antes de enviar.
- `worker_reviews_viewed` suma `verifiedCount`; `experiment_exposure` con
  `location: "worker_profile"`.

### Pruebas

- `tests/verified-reviews.spec.js` (22): dominio, API, tratamiento, estados vacío y de error,
  flag apagado o en control y comentario del modal.
- Resultado: `npm test` 200/200; `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Encendido (tratamiento) | Perfil con promedio, distribución, servicios completados e insignias con servicio y fecha |
| Encendido (tratamiento) | La lista tras ordenar "Más antiguas" y filtrar un servicio |
| Encendido, sin reseñas | Perfil de un prestador/a sin reseñas: mensaje sin promedio |
| Apagado | El mismo perfil con la lista de siempre |
| Cualquiera | Modal de reseña con el comentario vacío y el mensaje de validación |

## US39 — Aviso de límite de intentos de acceso

| Dato | Valor |
|---|---|
| Ramas | `feature/us39-limite-intentos`, `feature/us39-limite-2fa-setup` |
| Commits | `67690c9` feat(web): US39 muestra la espera cuando se limitan los intentos de acceso<br>`4c68c8b` test(web): US39 pruebas del mensaje de límite de intentos<br>`5364153` feat(web): US39 muestra la espera del límite de intentos al activar el 2FA<br>`7f7e213` test(web): US39 prueba el límite de intentos en la activación del 2FA |
| Pantallas afectadas | `/login`, `/2fa-verify`, `/2fa-setup` |
| Experimento | Ninguno (siempre activo) |
| Endpoints | `POST /api/auth/login`, `POST /api/auth/2fa/verify`, `POST /api/auth/2fa/enable` (respuesta `429`) |

### Comportamiento

- Ante un `429`: "Demasiados intentos. Vuelve a intentarlo en N segundos." (es y en), con
  `retryAfterSeconds` del cuerpo o, si falta, la cabecera `Retry-After`. Sin ninguno, se pide
  esperar un momento.
- Límites del API por dirección IP: 5 inicios de sesión y 10 comprobaciones de código por
  minuto.
- La activación del 2FA (`/2fa-setup`) comparte el límite de códigos y muestra el mismo mensaje.

### Pruebas

- `tests/rate-limit.spec.js` (23): lectura de la espera y las tres pantallas (es, en, sin dato y
  otros errores).
- Resultado: `npm test` 217/217 al cerrar la primera rama y 281/281 al cerrar la segunda;
  `npm run build` correcto (Node 24).

### Capturas a tomar

| Situación | Captura |
|---|---|
| Normal | `/login` con credenciales erróneas: mensaje de siempre |
| Límite | `/login` tras el sexto intento en un minuto: mensaje con los segundos, y en Network el `429` |
| Límite 2FA | `/2fa-verify` o `/2fa-setup` tras el undécimo código en un minuto |

## US36 — Seguimiento y tiempos de atención de reclamos

| Dato | Valor |
|---|---|
| Rama | `feature/us36-seguimiento-reclamos` |
| Commits | `c75197f` feat(web): US36 muestra fechas, tiempos de atención y resumen de reclamos<br>`46da2be` test(web): US36 pruebas de tiempos, historial y resumen de reclamos |
| Pantallas afectadas | `/admin/claims`, `/reclamos/seguimiento` |
| Experimento | Ninguno (siempre activo) |
| Endpoints | `GET /api/claims/{id}/history`, `GET /api/claims/summary?from=&to=` (administrador), `GET /api/claims`, `GET /api/claims/track/{code}` |

### Comportamiento

- Administrador: resumen por periodo (total, cantidad por estado, cerrados y promedio de
  resolución); en cada reclamo, fecha de registro, tiempo hasta la primera revisión y hasta el
  cierre, e historial de cambios con fecha, hora y responsable.
- En revisión, la primera revisión se calcula con el historial; en los cerrados la entrega el
  API. Los reclamos revisados antes de que existiera el historial muestran "Sin dato".
- Resueltos y rechazados: sin selector ni nota editable. Se avisa de que cerrar es definitivo.
- La nota actual aparece en el campo: al actualizar se reemplaza, así que ya no se borra por
  enviar el campo vacío sin querer.
- Seguimiento público: estado, fecha de registro y, si está cerrado, fecha de cierre y tiempo
  hasta el cierre. El API público no entrega las fechas intermedias ni la primera revisión (el
  historial es solo para el administrador), por lo que no se muestran.

### Pruebas

- `tests/claims-follow-up.spec.js` (34): estados y tiempos, panel del administrador y
  seguimiento público.
- Resultado: `npm test` 251/251; `npm run build` correcto (Node 24).

### Capturas a tomar

| Situación | Captura |
|---|---|
| Resumen | `/admin/claims`: tarjeta "Resumen por periodo" con un rango de fechas |
| En revisión | Reclamo con tiempo hasta la primera revisión y las opciones de cambio de estado |
| Cerrado | Reclamo resuelto con tiempos, historial abierto y sin controles de cambio |
| Público | `/reclamos/seguimiento` de un reclamo cerrado (fechas y tiempo) y de uno abierto |

## US38 — Soluciones a problemas frecuentes

| Dato | Valor |
|---|---|
| Rama | `feature/us38-soluciones-frecuentes` |
| Commits | `fff5a9c` feat(web): US38 ofrece soluciones a problemas frecuentes antes del reclamo<br>`0fec3fc` test(web): US38 pruebas de la ayuda y su acceso al reclamo |
| Pantallas afectadas | `/ayuda` (nueva), `/reclamos` |
| Experimento | `EC-BLQ04` (activación por periodo, pública; sin grupo de control) |

### Comportamiento

- Encendido: `/reclamos` muestra la tarjeta "Antes de registrar un reclamo" que lleva a
  `/ayuda`, como en la app móvil; el formulario sigue disponible en la misma pantalla.
- `/ayuda`: preguntas por categoría (reservas, cuenta y acceso, prestadores/as y membresías).
  "Sí, se resolvió" registra `faq_resolved` sin crear reclamo; "No, registrar un reclamo" abre
  `/reclamos?categoria=<id>` con la categoría en "Servicio relacionado"; el enlace directo al
  Libro de Reclamaciones está siempre visible.
- Apagado o sin configuración: `/reclamos` sin cambios y `/ayuda` redirige a `/reclamos`.
- Textos de la app móvil en lenguaje neutro. Se ajustaron a la web "Reservas" (en la app, "Mis
  reservas") y la cancelación, que la web ofrece solo en reservas pendientes (la app también en
  aceptadas).
- Los eventos de una visita sin sesión quedan en la cola y se envían cuando alguien inicia
  sesión en ese navegador, porque el API exige sesión.

### Pruebas

- `tests/support-faq.spec.js` (14): catálogo y textos, vista, eventos, flag y Libro de
  Reclamaciones.
- Resultado: `npm test` 265/265; `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Encendido | `/reclamos` con la tarjeta "Antes de registrar un reclamo" |
| Encendido | `/ayuda` con una pregunta abierta y, otra, tras "Sí, se resolvió" |
| Encendido | `/reclamos` abierto desde "No, registrar un reclamo", con la categoría completada |
| Apagado | `/reclamos` sin la tarjeta; `/ayuda` redirigiendo a `/reclamos` |

## Arreglos de la auditoría

Rama `fix/auditoria-web`; pruebas en `tests/audit-fixes.spec.js` (10). Resultado: `npm test`
275/275; `npm run build` correcto (Node 24).

| Commit | Arreglo | Pantallas | Captura |
|---|---|---|---|
| `607c415` fix(web): quita la barra repetida en la tarifa por hora | "//hora" pasa a "/hora"; la reserva traduce la unidad | Eventos (tarjeta y detalles), `/client/worker/:id/book` | Tarjeta de evento y formulario de reserva en es y en |
| `af07c77` fix(web): muestra solo el total en las solicitudes de reserva | Se quita "Tu ganancia", que mostraba una cifra vacía | `/worker/requests` | Solicitud con "Total referencial" |
| `48048b0` fix(web): usa lenguaje neutro en los textos visibles | Femenino genérico a "prestador/a" | Inicio de sesión, registro, búsqueda, perfil, reservas, eventos, mensajes | Login, registro y búsqueda |

Los textos legales (`public/docs/terms-v3.md` y `privacy-v3.md`) no se modificaron.

## US32 — Área de atención del prestador/a

| Dato | Valor |
|---|---|
| Rama | `feature/us32-area-de-atencion` |
| Commits | `53cf498` test(web): US32 captura las pantallas actuales para comprobar que no cambian con el flag apagado<br>`c96ce5b` feat(web): US32 registra el área de atención y muestra el distrito y la distancia en el perfil<br>`c758939` test(web): US32 pruebas del área de atención y del perfil |
| Pantallas afectadas | `/worker/profile` y `/client/worker/:id` |
| Endpoints | `GET` y `PUT /api/workers/me/service-area`; `GET /api/workers/{id}?district=` |
| Experimento | `EC-BLQ01-SA` (todo prestador/a mientras esté encendido) |
| Eventos de tracking | Ninguno: el plan 8.2.8 no define eventos para esta historia |

### Comportamiento

- Con el experimento activo, el perfil del prestador/a suma la tarjeta "Área de atención": distrito
  (lista cerrada de los 50 de Lima y Callao) y radio entero de 1 a 15 km, con guardado propio.
- Fuera de rango o sin distrito no se envía y se comunica el rango. Si el servidor tiene otros
  límites, se muestra su mensaje.
- `404` en la consulta muestra el formulario vacío; `403` oculta la tarjeta.
- El perfil que ve el cliente muestra el distrito base y la distancia aproximada **solo si el API
  los envía** (con el experimento apagado llegan en `null`). No muestra radio ni dirección.
- La distancia necesita el distrito del cliente: se elige en el mismo perfil, solo cuando hay
  distrito base, y se recuerda en el navegador.

### Pruebas

- `tests/us32-screen-unchanged.spec.js` (4): con el flag apagado el marcado de las dos pantallas es
  idéntico al capturado antes de implementar (`tests/__snapshots__/us32-*.html`).
- `tests/service-area.spec.js` (32): distritos y radio, formulario, errores, `403`, textos en inglés
  y perfil del cliente.
- Resultado: `npm test` 320/320 (284 anteriores y 36 de US32); `npm run build` correcto (Node 24).

### Capturas a tomar

| Estado del flag | Captura |
|---|---|
| Apagado | `/worker/profile` sin la tarjeta |
| Encendido | Tarjeta vacía, área guardada, radio fuera de rango y perfil visto por el cliente con la distancia |
