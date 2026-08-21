# kassiopeia.band

Band website — FastAPI backend (Python 3.12) + React/Vite SPA frontend,
PostgreSQL DB. Live at `kassiopeia.band` and `kass.fm` — the **same
site/build/Caddy block**; `kass.fm` is not a separate deployment.

## Structure

```
kassiopeia.band/
├── backend/    # FastAPI app (Python 3.12)
├── frontend/   # React/Vite SPA (npm name: kassiopeia-frontend)
├── docs/       # marketing-links.md etc.
└── README.md
```

## Deployment

- **Production**: Hetzner VPS, CI/CD deploys on push to `main`.
- **Dev/test**: home server, `test.kass.fm` (basic auth) — same
  container names as prod, different host.

For full docs, see the knowledge base:
`~/ai/claude-knowledge-base/README.md`,
`projects/web/kassiopeia-band.md`, and `projects/personal/kassiopeia/`.
