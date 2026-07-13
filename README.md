# Adversary

Stress-test a startup pitch against a panel of adversarial AI personas that
genuinely debate and rebut each other — not a single chatbot giving one
opinion, a small "society" of competing viewpoints with real tension between
them.

Built for the **Qwen Cloud / Alibaba Cloud Global AI Hackathon Series — Track:
Agent Society**.

## Features

- **Core panel (always active):** VC (market size, defensibility, moat),
  Engineer (assumes it's harder to build than you think), Customer (only
  cares whether this beats their current alternative). Each reacts
  independently in Round 1, then gets exactly one rebuttal turn in Round 2
  after seeing the other panelists' openings.
- **Domain-aware classifier:** a Qwen call reads the pitch and suggests 2–4
  additional personas from an 18-role library (healthcare, fintech,
  consumer/social, deep tech, enterprise SaaS, legal/regulated,
  climate/energy), each justified with a specific detail from the pitch —
  not a generic category match. Add up to 2 per session; each joins with its
  own opening reaction plus a rebuttal against the existing panel.
- **Mediator verdict:** a flagship-model call synthesizes the full transcript
  into a fundability score (1–10), the strongest point in the pitch's favor,
  the weakest point, the single biggest risk, and one concrete next step.
- **Real-time streaming:** Server-Sent Events, so the frontend shows agents
  "speaking" one at a time instead of dumping a wall of text.
- **Every debate is persisted:** a record in Postgres (Alibaba Cloud RDS) and
  the full transcript exported as JSON to Alibaba Cloud OSS.

## Architecture

```
┌─────────────┐      SSE (fetch + ReadableStream)      ┌─────────────┐
│   Next.js    │ ─────────────────────────────────────▶ │   Express    │
│  (frontend)  │ ◀───────────────────────────────────── │  (backend)   │
└─────────────┘                                          └──────┬───────┘
                                                                  │
                                        ┌─────────────────────────┼─────────────────────────┐
                                        ▼                         ▼                         ▼
                                ┌───────────────┐        ┌────────────────┐        ┌────────────────┐
                                │  Qwen Cloud    │        │ Alibaba Cloud   │        │ Alibaba Cloud  │
                                │ (DashScope,    │        │ RDS PostgreSQL  │        │ OSS            │
                                │ OpenAI-compat) │        │ (debate record) │        │ (transcript     │
                                └───────────────┘        └────────────────┘        │  JSON export)  │
                                                                                     └────────────────┘
```

In production, nginx fronts both containers on port 80: `/api/*` proxies to
the backend (with SSE-safe buffering/timeout settings — debate calls can run
a minute or more), everything else proxies to the Next.js frontend. See
[`nginx/nginx.conf`](nginx/nginx.conf).

**Alibaba Cloud deployment proof:** [`backend/src/oss.ts`](backend/src/oss.ts)
is a clean, non-stubbed use of the `ali-oss` SDK — every completed debate is
uploaded there as JSON. RDS wiring lives in
[`backend/src/db.ts`](backend/src/db.ts) and
[`backend/src/pgStore.ts`](backend/src/pgStore.ts).

### Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| LLM | Qwen Cloud, OpenAI-compatible endpoint (`qwen3.7-plus` for personas, `qwen3.7-max` for the mediator — both env-overridable) |
| Database | Alibaba Cloud RDS for PostgreSQL |
| Object storage | Alibaba Cloud OSS (`ali-oss` SDK) |
| Realtime | Server-Sent Events |
| Deployment | Docker Compose + nginx on Alibaba Cloud ECS |

## Local setup

### Option A — without Docker

Requires Node.js 20+.

```bash
# 1. Backend
cd backend
cp .env.example .env      # fill in QWEN_API_KEY at minimum
npm install
npm run dev                # http://localhost:4000

# 2. Frontend (separate terminal)
cd frontend
cp .env.example .env.local # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
npm install
npm run dev                # http://localhost:3000
```

Without `RDS_HOST` set, the backend falls back to an in-memory debate store
(debates don't survive a restart). Without OSS credentials set, transcripts
are written to `backend/data/transcripts/` instead. Both fallbacks are
automatic — nothing else to configure for local development.

To run the frontend against the Phase 1 mock instead of a live backend (no
API key needed), set `NEXT_PUBLIC_USE_MOCK=true` in `frontend/.env.local`.

### Option B — with Docker Compose

```bash
cp .env.example .env   # fill in QWEN_API_KEY at minimum
docker compose up --build
```

Serves the whole app on **http://localhost** (nginx on port 80, proxying to
both containers).

### Applying the RDS schema

Once `RDS_HOST` (and the other `RDS_*` vars) are set in `backend/.env` (or
the root `.env` for Docker):

```bash
cd backend
npm run migrate         # or: npm run build && npm run migrate:built
```

This applies [`backend/src/schema.sql`](backend/src/schema.sql) (idempotent —
safe to re-run).

## Deploying to Alibaba Cloud ECS

Assumes an ECS instance with Docker + the Compose plugin already installed,
and this repo cloned onto it.

```bash
# On the ECS instance, inside the cloned repo:
cp .env.example .env
# fill in QWEN_API_KEY, RDS_*, and OSS_* credentials
./deploy.sh
```

`deploy.sh` pulls the latest commit, rebuilds the three containers (backend,
frontend, nginx), and brings them up with `docker compose up -d`. Re-run it
for subsequent deploys.

Point your domain (or the instance's public IP) at the ECS instance — the
app is served on port 80.

## Repo layout

```
backend/     Express API, Qwen Cloud + RDS + OSS integration
frontend/    Next.js app (App Router)
nginx/       Reverse proxy config used by docker-compose
docs/        Drop the architecture diagram export here
deploy.sh    ECS deployment script
docker-compose.yml
```

## License

MIT — see [LICENSE](LICENSE).
