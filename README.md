# AuraTrack

Aplikasi Android React Native untuk tracking aktivitas olahraga dengan fokus social sharing.

## Stack
- Mobile: React Native (Expo)
- Backend: Node.js + Fastify + TypeScript
- Database: PostgreSQL + PostGIS
- Cache/Queue: Redis

## Struktur Proyek
- `apps/mobile`: aplikasi Android
- `apps/api`: backend Fastify
- `docs`: PRD dan roadmap
- `infra`: SQL schema awal

## Menjalankan Local
1. Jalankan semua service (API + Postgres + Redis):
```bash
docker compose up -d --build
```
Jika memakai Docker context remote, apply schema manual:
```bash
cat infra/schema.sql | docker exec -i strava_expert_postgres psql -U strava -d strava_expert
```
2. Jalankan mobile app:
```bash
npm install
npm run mobile:start
```
Lalu tekan `a` di terminal Expo untuk membuka Android emulator.

Untuk Android emulator, endpoint backend default sudah `http://10.0.2.2:8000`.
Untuk device fisik, sesuaikan `localLanBase` di `apps/mobile/src/services/api.js`.

## Cek Service
```bash
docker compose ps
docker compose logs api --tail=100
curl http://localhost:18001/health
```

## Endpoint API Saat Ini
- `GET /health`
- `GET /api/v1/activities`
- `GET /api/v1/ai/insight`
- `GET /api/v1/safety/status`
