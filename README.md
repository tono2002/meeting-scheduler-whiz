# Café con Tono y Jo

Página de reservas para reuniones de 90 min (Next.js + Supabase, desplegada en Vercel).

## Cambiar días, horas o bloqueos

Todo está en `config/availability.ts` (hora de Madrid):

- `DAYS`: días reservables, `"YYYY-MM-DD"`.
- `FIRST_START` / `LAST_START` / `STEP_MINUTES`: horas de inicio posibles.
- `BLOCKS`: cuándo estáis ocupados, p. ej. `{ date: "2026-10-20", from: "12:00", to: "13:30" }`.
  Una hora está libre solo si su reunión `[inicio, inicio + 90 min)` no pisa ningún bloqueo ni reserva.
- `MEETING_MINUTES` (90) y `MIN_NOTICE_MINUTES` (120, oculta horas a menos de 2 h).

Si cambias `MEETING_MINUTES`, cambia también la restricción `bookings_duration` en la base de datos.

Haz commit y push: Vercel redespliega solo (o `vercel --prod`). Después: `npm test`.

## Foto

Deja `public/manolo.jpg` y redespliega. Sin ella se muestra un fondo cálido.

## Admin

`/admin` con `ADMIN_PASSWORD`. Cancelar una reserva libera su hora.

## Desarrollo

```bash
npm install
# .env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD, SESSION_SECRET
npm run dev
npm test                                       # disponibilidad
TEST_URL=http://localhost:3000 ADMIN_PASSWORD=... npm run test:e2e   # API en vivo (usa el jueves 22 y cancela lo que crea)
```

Migración: `supabase/migrations/` (aplicada con `supabase db query --linked -f ...`).
