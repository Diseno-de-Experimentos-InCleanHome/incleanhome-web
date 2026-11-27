# Capturas de evidencia To-Be

57 capturas tomadas el 26/11/2026 en un entorno **local**, con las ramas `develop` de la web y
del backend. No se usó ningún ambiente de producción.

- Web: `http://localhost:5173` (proxy de `/api` hacia el API local).
- API y Swagger: `http://localhost:5080` en `Development`, base PostgreSQL 18 `incleanhome_demo`.
- Ventana de 1280×800 con `deviceScaleFactor` 2 (imágenes de 2560×1600). Los archivos
  `*-historial-completo-*` y los de cada endpoint en Swagger son recortes de un elemento y tienen
  otro tamaño.
- `-on`: `EC-BLQ01`, `EC-BLQ02`, `EC-BLQ03`, `EC-BLQ04`, `EC-BLQ06` y `EC-BLQ01-SA` activos al 100 %.
  `-off`: los mismos seis apagados.
- Todas las personas, correos, teléfonos, documentos, reservas, reseñas y reclamos son **ficticios**.
  Las fechas pasadas se asignaron directamente en la base local, porque el API no admite reservar en
  una fecha pasada.

## Historias sin captura de pantalla

| Historia | Experimento | Motivo |
|---|---|---|
| US32 — Área de atención del prestador/a | `EC-BLQ01-SA` | La web no tiene la pantalla y el backend no publica `/api/workers/me/service-area` |
| US33 — Sugerencia de prestadores/as | `EC-BLQ01` | La web no tiene la pantalla y el backend no publica `/api/workers/suggestions` |
| US35 — Recordatorio de calificación | `EC-BLQ03` | La web no tiene el recordatorio y el backend no tiene el envío |

En estas tres historias, la web y el backend solo declaran el identificador del experimento y, en el
backend, parte del plan de tracking. La app Android sí tiene interfaz para ellas; no forma parte de
estas capturas. Activar o apagar sus flags no cambia ninguna pantalla de la web.

## Pantallas

### US34 — Reseñas verificadas e historial del prestador/a (`EC-BLQ02`)

La cabecera del perfil se ve igual en ambos estados porque todas las reseñas de prueba son verificadas (4.3 y 4 reseñas). La validación del comentario en el modal no depende del flag.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us34-modal-comentario-obligatorio-on.png`](us34-modal-comentario-obligatorio-on.png) | Modal de reseña: comentario obligatorio | `http://localhost:5173/client/bookings` | US34 | Validación sin flag; todos los experimentos activos |
| [`us34-modal-comentario-obligatorio-off.png`](us34-modal-comentario-obligatorio-off.png) | Modal de reseña: comentario obligatorio | `http://localhost:5173/client/bookings` | US34 | Validación sin flag; todos los experimentos apagados |
| [`us34-perfil-cabecera-on.png`](us34-perfil-cabecera-on.png) | Perfil del prestador/a: cabecera con la calificación | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 activo (100 %) |
| [`us34-perfil-cabecera-off.png`](us34-perfil-cabecera-off.png) | Perfil del prestador/a: cabecera con la calificación | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 apagado |
| [`us34-perfil-resenas-on.png`](us34-perfil-resenas-on.png) | Reseñas verificadas: promedio, distribución, servicios completados e insignias | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 activo (100 %) |
| [`us34-perfil-resenas-off.png`](us34-perfil-resenas-off.png) | Lista de reseñas de siempre | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 apagado |
| [`us34-resenas-historial-completo-on.png`](us34-resenas-historial-completo-on.png) | Sección completa de reseñas verificadas (recorte del elemento) | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 activo (100 %) |
| [`us34-resenas-historial-completo-off.png`](us34-resenas-historial-completo-off.png) | Tarjeta completa de reseñas (recorte del elemento) | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 apagado |
| [`us34-resenas-orden-y-filtro-on.png`](us34-resenas-orden-y-filtro-on.png) | Orden "Más antiguas" y filtro "Limpieza general" | `http://localhost:5173/client/worker/4` | US34 | EC-BLQ02 activo (100 %) |
| [`us34-sin-resenas-on.png`](us34-sin-resenas-on.png) | Perfil de un prestador/a sin reseñas | `http://localhost:5173/client/worker/6` | US34 | EC-BLQ02 activo (100 %) |
| [`us34-sin-resenas-off.png`](us34-sin-resenas-off.png) | Perfil de un prestador/a sin reseñas | `http://localhost:5173/client/worker/6` | US34 | EC-BLQ02 apagado |

### US36 — Seguimiento y tiempos de atención de reclamos

No tiene flag propio: las capturas `-off` muestran que la pantalla no cambia con los experimentos apagados.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us36-admin-en-revision-on.png`](us36-admin-en-revision-on.png) | Reclamo en revisión: tiempos, historial y cambio de estado | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos activos |
| [`us36-admin-en-revision-off.png`](us36-admin-en-revision-off.png) | Reclamo en revisión: tiempos, historial y cambio de estado | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos apagados |
| [`us36-admin-resuelto-on.png`](us36-admin-resuelto-on.png) | Reclamo resuelto: tiempos, historial y sin controles de cambio | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos activos |
| [`us36-admin-resuelto-off.png`](us36-admin-resuelto-off.png) | Reclamo resuelto: tiempos, historial y sin controles de cambio | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos apagados |
| [`us36-admin-resumen-periodo-on.png`](us36-admin-resumen-periodo-on.png) | Administrador: resumen por periodo | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos activos |
| [`us36-admin-resumen-periodo-off.png`](us36-admin-resumen-periodo-off.png) | Administrador: resumen por periodo | `http://localhost:5173/admin/claims` | US36 | Sin flag propio; todos los experimentos apagados |
| [`us36-seguimiento-en-revision-on.png`](us36-seguimiento-en-revision-on.png) | Seguimiento público de un reclamo abierto | `http://localhost:5173/reclamos/seguimiento?code=RC-2026-194685` | US36 | Sin flag propio; todos los experimentos activos |
| [`us36-seguimiento-en-revision-off.png`](us36-seguimiento-en-revision-off.png) | Seguimiento público de un reclamo abierto | `http://localhost:5173/reclamos/seguimiento?code=RC-2026-194685` | US36 | Sin flag propio; todos los experimentos apagados |
| [`us36-seguimiento-resuelto-on.png`](us36-seguimiento-resuelto-on.png) | Seguimiento público de un reclamo cerrado | `http://localhost:5173/reclamos/seguimiento?code=RC-2026-573168` | US36 | Sin flag propio; todos los experimentos activos |
| [`us36-seguimiento-resuelto-off.png`](us36-seguimiento-resuelto-off.png) | Seguimiento público de un reclamo cerrado | `http://localhost:5173/reclamos/seguimiento?code=RC-2026-573168` | US36 | Sin flag propio; todos los experimentos apagados |

### US38 — Soluciones a problemas frecuentes (`EC-BLQ04`)

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us38-ayuda-pregunta-on.png`](us38-ayuda-pregunta-on.png) | /ayuda: categorías y respuesta abierta | `http://localhost:5173/ayuda` | US38 | EC-BLQ04 activo (100 %) |
| [`us38-ayuda-redirige-off.png`](us38-ayuda-redirige-off.png) | Al abrir /ayuda se redirige a /reclamos | `http://localhost:5173/reclamos` | US38 | EC-BLQ04 apagado |
| [`us38-ayuda-resuelta-on.png`](us38-ayuda-resuelta-on.png) | /ayuda: consulta marcada como resuelta | `http://localhost:5173/ayuda` | US38 | EC-BLQ04 activo (100 %) |
| [`us38-libro-reclamaciones-on.png`](us38-libro-reclamaciones-on.png) | Libro de Reclamaciones con la tarjeta "Antes de registrar un reclamo" | `http://localhost:5173/reclamos` | US38 | EC-BLQ04 activo (100 %) |
| [`us38-libro-reclamaciones-off.png`](us38-libro-reclamaciones-off.png) | Libro de Reclamaciones sin tarjeta de ayuda | `http://localhost:5173/reclamos` | US38 | EC-BLQ04 apagado |
| [`us38-reclamo-con-categoria-on.png`](us38-reclamo-con-categoria-on.png) | Libro abierto desde "No, registrar un reclamo", con la categoría completada | `http://localhost:5173/reclamos?categoria=bookings` | US38 | EC-BLQ04 activo (100 %) |

### US39 — Límite de intentos de acceso

No tiene flag propio: las capturas `-off` muestran que el comportamiento no cambia con los experimentos apagados.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us39-2fa-limite-on.png`](us39-2fa-limite-on.png) | Verificación 2FA: espera tras superar 10 códigos por minuto (429) | `http://localhost:5173/2fa-verify` | US39 | Sin flag propio; todos los experimentos activos |
| [`us39-2fa-limite-off.png`](us39-2fa-limite-off.png) | Verificación 2FA: espera tras superar 10 códigos por minuto (429) | `http://localhost:5173/2fa-verify` | US39 | Sin flag propio; todos los experimentos apagados |
| [`us39-login-credenciales-erroneas-on.png`](us39-login-credenciales-erroneas-on.png) | Inicio de sesión: error de credenciales (antes del límite) | `http://localhost:5173/login` | US39 | Sin flag propio; todos los experimentos activos |
| [`us39-login-credenciales-erroneas-off.png`](us39-login-credenciales-erroneas-off.png) | Inicio de sesión: error de credenciales (antes del límite) | `http://localhost:5173/login` | US39 | Sin flag propio; todos los experimentos apagados |
| [`us39-login-limite-on.png`](us39-login-limite-on.png) | Inicio de sesión: espera tras superar 5 intentos por minuto (429) | `http://localhost:5173/login` | US39 | Sin flag propio; todos los experimentos activos |
| [`us39-login-limite-off.png`](us39-login-limite-off.png) | Inicio de sesión: espera tras superar 5 intentos por minuto (429) | `http://localhost:5173/login` | US39 | Sin flag propio; todos los experimentos apagados |

### US41 — Monto estimado antes de reservar (`EC-BLQ06`)

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us41-reserva-fecha-y-horario-on.png`](us41-reserva-fecha-y-horario-on.png) | Formulario de reserva: fecha y horario elegidos | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |
| [`us41-reserva-fecha-y-horario-off.png`](us41-reserva-fecha-y-horario-off.png) | Formulario de reserva: fecha y horario elegidos | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 apagado |
| [`us41-reserva-monto-on.png`](us41-reserva-monto-on.png) | Tarjeta "Monto estimado": tarifa, duración y total (3 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |
| [`us41-reserva-monto-off.png`](us41-reserva-monto-off.png) | Tarjeta "Resumen" de siempre (3 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 apagado |
| [`us41-reserva-monto-recalculado-on.png`](us41-reserva-monto-recalculado-on.png) | Monto recalculado al cambiar la hora de fin (5 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |

## Swagger: endpoints nuevos y modificados

Comparados con el commit `6af2c7f` del backend (anterior a las mejoras To-Be). La documentación del
API no depende de los flags; el sufijo `-on` indica el estado con el que se tomó. En las tres filas de
US42 marcadas como "solo registra evento", el cambio es interno y Swagger se ve como antes.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us34-swagger-get-reviews-worker-id-on.png`](us34-swagger-get-reviews-worker-id-on.png) | Swagger: GET /api/reviews/worker/{id} (modificado) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us34-swagger-get-reviews-worker-id-summary-on.png`](us34-swagger-get-reviews-worker-id-summary-on.png) | Swagger: GET /api/reviews/worker/{id}/summary (nuevo) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us34-swagger-post-reviews-on.png`](us34-swagger-post-reviews-on.png) | Swagger: POST /api/reviews (modificado) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us36-swagger-get-claims-on.png`](us36-swagger-get-claims-on.png) | Swagger: GET /api/claims (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-get-claims-id-history-on.png`](us36-swagger-get-claims-id-history-on.png) | Swagger: GET /api/claims/{id}/history (nuevo) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-get-claims-summary-on.png`](us36-swagger-get-claims-summary-on.png) | Swagger: GET /api/claims/summary (nuevo) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-patch-claims-id-review-on.png`](us36-swagger-patch-claims-id-review-on.png) | Swagger: PATCH /api/claims/{id}/review (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-post-claims-on.png`](us36-swagger-post-claims-on.png) | Swagger: POST /api/claims (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us39-swagger-post-auth-2fa-enable-on.png`](us39-swagger-post-auth-2fa-enable-on.png) | Swagger: POST /api/auth/2fa/enable (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us39-swagger-post-auth-2fa-verify-on.png`](us39-swagger-post-auth-2fa-verify-on.png) | Swagger: POST /api/auth/2fa/verify (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us39-swagger-post-auth-login-on.png`](us39-swagger-post-auth-login-on.png) | Swagger: POST /api/auth/login (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us41-swagger-post-bookings-on.png`](us41-swagger-post-bookings-on.png) | Swagger: POST /api/bookings (modificado) | `http://localhost:5080/swagger/index.html` | US41 | No depende de flags |
| [`us41-swagger-post-bookings-estimate-on.png`](us41-swagger-post-bookings-estimate-on.png) | Swagger: POST /api/bookings/estimate (nuevo) | `http://localhost:5080/swagger/index.html` | US41 | No depende de flags |
| [`us42-swagger-patch-bookings-id-status-on.png`](us42-swagger-patch-bookings-id-status-on.png) | Swagger: PATCH /api/bookings/{id}/status (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-post-messages-userId-on.png`](us42-swagger-post-messages-userId-on.png) | Swagger: POST /api/messages/{userId} (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-post-tracking-events-on.png`](us42-swagger-post-tracking-events-on.png) | Swagger: POST /api/tracking/events (nuevo) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-put-workers-id-availability-on.png`](us42-swagger-put-workers-id-availability-on.png) | Swagger: PUT /api/workers/{id}/availability (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us43-swagger-general-on.png`](us43-swagger-general-on.png) | Swagger UI: vista general | `http://localhost:5080/swagger/index.html` | US43 | No depende de flags |
| [`us43-swagger-get-experiments-config-on.png`](us43-swagger-get-experiments-config-on.png) | Swagger: GET /api/experiments/config (nuevo) | `http://localhost:5080/swagger/index.html` | US43 | No depende de flags |
