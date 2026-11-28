# Capturas de evidencia To-Be

84 capturas tomadas en un entorno **local**, con las ramas `develop` de la web y del backend: 57 el
26/11/2026 y 27 (US32, US33, US35 y US40) el 27/11/2026. No se usó ningún ambiente de producción.

- Web: `http://localhost:5173` (proxy de `/api` hacia el API local).
- API y Swagger: `http://localhost:5080` en `Development`, base PostgreSQL 18 `incleanhome_demo`.
  Las del 27/11 usan una copia desechable de esa base, para no alterar sus datos, con el backend en
  `7101063` y la web en `1bdd537`.
- Para el `403` de US33 y el cambio obligatorio de US40, una segunda instancia del API en
  `http://localhost:5081` respondió esas peticiones de la web.
- Ventana de 1280×800 con `deviceScaleFactor` 2 (imágenes de 2560×1600). Los archivos
  `*-historial-completo-*` y los de cada endpoint en Swagger son recortes de un elemento y tienen
  otro tamaño.
- `-on`: `EC-BLQ01`, `EC-BLQ02`, `EC-BLQ03`, `EC-BLQ04`, `EC-BLQ06` y `EC-BLQ01-SA` activos al 100 %.
  `-off`: los mismos seis apagados.
- Todas las personas, correos, teléfonos, documentos, reservas, reseñas y reclamos son **ficticios**.
  Las fechas pasadas se asignaron directamente en la base local, porque el API no admite reservar en
  una fecha pasada.
- Ninguna captura muestra contraseñas, tokens ni secretos del segundo factor.

## Capturas repetidas tras dos arreglos

Estas tres se volvieron a tomar el 26/11/2026; las demás no cambiaron.

| Archivo | Qué corrige | Commit en `develop` |
|---|---|---|
| [`us43-swagger-get-experiments-config-on.png`](us43-swagger-get-experiments-config-on.png) | Swagger muestra completa la fórmula `SHA-256("<experimentId>:<userId>")` | Backend `5a75a91` |
| [`us39-login-credenciales-erroneas-on.png`](us39-login-credenciales-erroneas-on.png) | El error de credenciales sale en el idioma de la interfaz | Web `9cf0f9e` |
| [`us39-login-credenciales-erroneas-off.png`](us39-login-credenciales-erroneas-off.png) | El error de credenciales sale en el idioma de la interfaz | Web `9cf0f9e` |

## Pantallas

### US32 — Área de atención del prestador/a (`EC-BLQ01-SA`)

Con el flag apagado el formulario no aparece y el API no envía el distrito del prestador/a. En el perfil público, la distancia se calcula al distrito que elige el cliente (Santiago de Surco).

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us32-perfil-propio-area-on.png`](us32-perfil-propio-area-on.png) | Perfil propio: "Área de atención" con distrito y radio guardados | `http://localhost:5173/worker/profile` | US32 | EC-BLQ01-SA activo (100 %) |
| [`us32-perfil-propio-area-off.png`](us32-perfil-propio-area-off.png) | Perfil propio sin el formulario de área de atención | `http://localhost:5173/worker/profile` | US32 | EC-BLQ01-SA apagado |
| [`us32-perfil-publico-distrito-on.png`](us32-perfil-publico-distrito-on.png) | Perfil público: distrito base y distancia aproximada al distrito elegido (Santiago de Surco) | `http://localhost:5173/client/worker/4` | US32 | EC-BLQ01-SA activo (100 %) |
| [`us32-perfil-publico-distrito-off.png`](us32-perfil-publico-distrito-off.png) | Perfil público sin distrito base ni distancia | `http://localhost:5173/client/worker/4` | US32 | EC-BLQ01-SA apagado |

### US33 — Prestadores/as sugeridos al reservar (`EC-BLQ01`)

En `-off` también está apagado `EC-BLQ06`, por eso aparece la tarjeta "Resumen" en lugar de "Monto estimado".

Caso `403`: la web cargó el experimento activo y la consulta de sugerencias la respondió un segundo API local con `EC-BLQ01` en control. El script comprobó la respuesta `403`, que la dirección escrita se conserva y que "Confirmar reserva" sigue habilitado. Llevan `-on` porque la web estaba con el flag activo.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us33-reserva-sugerencias-on.png`](us33-reserva-sugerencias-on.png) | Reserva: "Prestadores/as sugeridos" por cercanía y disponibilidad (30/11, 08:00 a 10:00, Miraflores) | `http://localhost:5173/client/worker/4/book` | US33 | EC-BLQ01 activo (100 %) |
| [`us33-reserva-sugerencias-off.png`](us33-reserva-sugerencias-off.png) | Reserva sin el bloque de sugerencias: dirección, resumen y confirmación | `http://localhost:5173/client/worker/4/book` | US33 | EC-BLQ01 apagado |
| [`us33-reserva-403-antes-on.png`](us33-reserva-403-antes-on.png) | 403, antes: bloque de sugerencias listo para consultar | `http://localhost:5173/client/worker/4/book` | US33 | Web con EC-BLQ01 activo (100 %); la consulta la responde un segundo API local con EC-BLQ01 en control |
| [`us33-reserva-403-bloque-oculto-on.png`](us33-reserva-403-bloque-oculto-on.png) | 403, después: el bloque desaparece sin avisos y la reserva sigue disponible | `http://localhost:5173/client/worker/4/book` | US33 | Web con EC-BLQ01 activo (100 %); la consulta la responde un segundo API local con EC-BLQ01 en control |

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

### US35 — Recordatorio para calificar (`EC-BLQ03`)

Se abre el enlace que lleva el recordatorio, con la sesión del cliente ya iniciada. La reserva 7 está completada y sin reseña; no se envió ninguna reseña. No se envió ningún correo: el canal local es simulado.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us35-enlace-recordatorio-on.png`](us35-enlace-recordatorio-on.png) | Enlace del recordatorio: se abre la reseña de la reserva 7 (Rosa Demo Quispe) | `http://localhost:5173/client/bookings?reviewBookingId=7&source=reminder` | US35 | EC-BLQ03 activo (100 %) |
| [`us35-enlace-recordatorio-off.png`](us35-enlace-recordatorio-off.png) | Enlace del recordatorio ignorado: "Reservas" sin ventana de reseña | `http://localhost:5173/client/bookings?reviewBookingId=7&source=reminder` | US35 | EC-BLQ03 apagado |

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

### US40 — Actividad de acceso y cambio de contraseña

No tiene flag propio, por eso solo hay capturas `-on`. La cuenta ficticia "Daniela Demo Torres" se creó solo para estas capturas. Los accesos "Móvil" los generó el script identificándose como la app Android (`User-Agent` de `okhttp`); no se usó la app. El script comprobó que, tras el reporte, la sesión móvil quedó cerrada (`401`). El cambio obligatorio depende de `Security__EnforcePasswordChange`, apagado por defecto: se tomó contra el segundo API local con la opción activada.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us40-actividad-on.png`](us40-actividad-on.png) | Actividad de la cuenta: estado del segundo factor y accesos web y móvil, correctos y fallidos | `http://localhost:5173/client/account` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-reporte-confirmacion-on.png`](us40-reporte-confirmacion-on.png) | Confirmación antes de reportar el acceso desde el móvil | `http://localhost:5173/client/account` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-reporte-enviado-on.png`](us40-reporte-enviado-on.png) | Acceso reportado: aviso para cambiar la contraseña y confirmación | `http://localhost:5173/client/account` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-sesion-cerrada-on.png`](us40-sesion-cerrada-on.png) | El otro navegador, tras el reporte: vuelve al inicio de sesión con el aviso | `http://localhost:5173/login` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-cambio-contrasena-on.png`](us40-cambio-contrasena-on.png) | Cambio de contraseña con sesión (solicitado tras el reporte) | `http://localhost:5173/client/account/password` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-cambio-contrasena-exito-on.png`](us40-cambio-contrasena-exito-on.png) | Contraseña cambiada: la sesión actual sigue abierta | `http://localhost:5173/client/account/password` | US40 | Sin flag propio; todos los experimentos activos |
| [`us40-cambio-obligatorio-on.png`](us40-cambio-obligatorio-on.png) | Cambio obligatorio al iniciar sesión, antes de abrir sesión | `http://localhost:5173/change-password` | US40 | Sin flag propio; segundo API local con Security__EnforcePasswordChange=true |
| [`us40-cambio-obligatorio-listo-on.png`](us40-cambio-obligatorio-listo-on.png) | Después del cambio obligatorio: se pide ingresar con la contraseña nueva | `http://localhost:5173/login` | US40 | Sin flag propio; segundo API local con Security__EnforcePasswordChange=true |

### US41 — Monto estimado antes de reservar (`EC-BLQ06`)

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us41-reserva-fecha-y-horario-on.png`](us41-reserva-fecha-y-horario-on.png) | Formulario de reserva: fecha y horario elegidos | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |
| [`us41-reserva-fecha-y-horario-off.png`](us41-reserva-fecha-y-horario-off.png) | Formulario de reserva: fecha y horario elegidos | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 apagado |
| [`us41-reserva-monto-on.png`](us41-reserva-monto-on.png) | Tarjeta "Monto estimado": tarifa, duración y total (3 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |
| [`us41-reserva-monto-off.png`](us41-reserva-monto-off.png) | Tarjeta "Resumen" de siempre (3 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 apagado |
| [`us41-reserva-monto-recalculado-on.png`](us41-reserva-monto-recalculado-on.png) | Monto recalculado al cambiar la hora de fin (5 h) | `http://localhost:5173/client/worker/4/book` | US41 | EC-BLQ06 activo (100 %) |

## Swagger: endpoints nuevos y modificados

Los de US34, US36, US39, US41, US42 y US43 se comparan con el commit `6af2c7f` del backend
(anterior a las mejoras To-Be). Los de US32, US33, US35 y US40 se tomaron con `7101063`.
`us41-swagger-post-bookings-on.png` y `us34-swagger-post-reviews-on.png` son anteriores a los campos
`origin` y `source`: el contrato actual está en las filas de US33 y US35.

La documentación del API no depende de los flags; el sufijo `-on` indica el estado con el que se
tomó. En las tres filas de US42 marcadas como "solo registra evento", el cambio es interno y Swagger
se ve como antes.

| Archivo | Pantalla | URL local | Historia | Flag |
|---|---|---|---|---|
| [`us32-swagger-get-workers-me-service-area-on.png`](us32-swagger-get-workers-me-service-area-on.png) | Swagger: GET /api/workers/me/service-area (nuevo) | `http://localhost:5080/swagger/index.html` | US32 | No depende de flags |
| [`us32-swagger-put-workers-me-service-area-on.png`](us32-swagger-put-workers-me-service-area-on.png) | Swagger: PUT /api/workers/me/service-area (nuevo) | `http://localhost:5080/swagger/index.html` | US32 | No depende de flags |
| [`us32-swagger-get-workers-id-on.png`](us32-swagger-get-workers-id-on.png) | Swagger: GET /api/workers/{id} (modificado) | `http://localhost:5080/swagger/index.html` | US32 | No depende de flags |
| [`us33-swagger-get-workers-suggestions-on.png`](us33-swagger-get-workers-suggestions-on.png) | Swagger: GET /api/workers/suggestions (nuevo) | `http://localhost:5080/swagger/index.html` | US33 | No depende de flags |
| [`us33-swagger-post-bookings-on.png`](us33-swagger-post-bookings-on.png) | Swagger: POST /api/bookings (modificado) | `http://localhost:5080/swagger/index.html` | US33 | No depende de flags |
| [`us34-swagger-get-reviews-worker-id-on.png`](us34-swagger-get-reviews-worker-id-on.png) | Swagger: GET /api/reviews/worker/{id} (modificado) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us34-swagger-get-reviews-worker-id-summary-on.png`](us34-swagger-get-reviews-worker-id-summary-on.png) | Swagger: GET /api/reviews/worker/{id}/summary (nuevo) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us34-swagger-post-reviews-on.png`](us34-swagger-post-reviews-on.png) | Swagger: POST /api/reviews (modificado) | `http://localhost:5080/swagger/index.html` | US34 | No depende de flags |
| [`us35-swagger-post-reviews-on.png`](us35-swagger-post-reviews-on.png) | Swagger: POST /api/reviews (modificado) | `http://localhost:5080/swagger/index.html` | US35 | No depende de flags |
| [`us36-swagger-get-claims-on.png`](us36-swagger-get-claims-on.png) | Swagger: GET /api/claims (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-get-claims-id-history-on.png`](us36-swagger-get-claims-id-history-on.png) | Swagger: GET /api/claims/{id}/history (nuevo) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-get-claims-summary-on.png`](us36-swagger-get-claims-summary-on.png) | Swagger: GET /api/claims/summary (nuevo) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-patch-claims-id-review-on.png`](us36-swagger-patch-claims-id-review-on.png) | Swagger: PATCH /api/claims/{id}/review (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us36-swagger-post-claims-on.png`](us36-swagger-post-claims-on.png) | Swagger: POST /api/claims (modificado) | `http://localhost:5080/swagger/index.html` | US36 | No depende de flags |
| [`us39-swagger-post-auth-2fa-enable-on.png`](us39-swagger-post-auth-2fa-enable-on.png) | Swagger: POST /api/auth/2fa/enable (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us39-swagger-post-auth-2fa-verify-on.png`](us39-swagger-post-auth-2fa-verify-on.png) | Swagger: POST /api/auth/2fa/verify (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us39-swagger-post-auth-login-on.png`](us39-swagger-post-auth-login-on.png) | Swagger: POST /api/auth/login (modificado) | `http://localhost:5080/swagger/index.html` | US39 | No depende de flags |
| [`us40-swagger-get-auth-access-activity-on.png`](us40-swagger-get-auth-access-activity-on.png) | Swagger: GET /api/auth/access-activity (nuevo) | `http://localhost:5080/swagger/index.html` | US40 | No depende de flags |
| [`us40-swagger-post-auth-access-activity-id-report-on.png`](us40-swagger-post-auth-access-activity-id-report-on.png) | Swagger: POST /api/auth/access-activity/{id}/report (nuevo) | `http://localhost:5080/swagger/index.html` | US40 | No depende de flags |
| [`us40-swagger-put-auth-password-on.png`](us40-swagger-put-auth-password-on.png) | Swagger: PUT /api/auth/password (nuevo) | `http://localhost:5080/swagger/index.html` | US40 | No depende de flags |
| [`us41-swagger-post-bookings-on.png`](us41-swagger-post-bookings-on.png) | Swagger: POST /api/bookings (modificado) | `http://localhost:5080/swagger/index.html` | US41 | No depende de flags |
| [`us41-swagger-post-bookings-estimate-on.png`](us41-swagger-post-bookings-estimate-on.png) | Swagger: POST /api/bookings/estimate (nuevo) | `http://localhost:5080/swagger/index.html` | US41 | No depende de flags |
| [`us42-swagger-patch-bookings-id-status-on.png`](us42-swagger-patch-bookings-id-status-on.png) | Swagger: PATCH /api/bookings/{id}/status (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-post-messages-userId-on.png`](us42-swagger-post-messages-userId-on.png) | Swagger: POST /api/messages/{userId} (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-post-tracking-events-on.png`](us42-swagger-post-tracking-events-on.png) | Swagger: POST /api/tracking/events (nuevo) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us42-swagger-put-workers-id-availability-on.png`](us42-swagger-put-workers-id-availability-on.png) | Swagger: PUT /api/workers/{id}/availability (modificado: solo registra evento; mismo contrato) | `http://localhost:5080/swagger/index.html` | US42 | No depende de flags |
| [`us43-swagger-general-on.png`](us43-swagger-general-on.png) | Swagger UI: vista general | `http://localhost:5080/swagger/index.html` | US43 | No depende de flags |
| [`us43-swagger-get-experiments-config-on.png`](us43-swagger-get-experiments-config-on.png) | Swagger: GET /api/experiments/config (nuevo) | `http://localhost:5080/swagger/index.html` | US43 | No depende de flags |
