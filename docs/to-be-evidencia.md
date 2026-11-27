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
