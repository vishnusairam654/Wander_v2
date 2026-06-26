# WanderWay
> AI-powered travel planning with real-time streaming

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=google-gemini&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## Features
- **SSE streaming:** Real-time generation of trip itineraries using Server-Sent Events.
- **Redis caching with TTL:** Fast retrieval of previously generated trips, reducing latency and API costs.
- **Rate limiting:** Protects the API from abuse using Redis-based rate limiting (10 req/min).
- **PDF export:** Generate and download a formatted PDF itinerary on the fly.
- **Trip sharing:** Share generated itineraries via unique trip IDs.
- **Type-safe API:** End-to-end type safety with Pydantic models (Python) and TypeScript interfaces (Next.js).
- **Prompt injection hardening:** System boundary guardrails and input length limits on all LLM calls.
- **Two UI systems coexisting:** Tailwind-based System A (`app/` + `components/`) and MUI/Framer Motion System B (`src/`).

## Architecture

```
                          +-----------------------+
                          |    Next.js 16 (UI)    |
                          |  ┌─────────────────┐  |
                          |  │  System A        │  |
                          |  │  (app/ + Tailwind)│  |
                          |  │  Chat, Plan Flow │  |
                          |  └─────────────────┘  |
                          |  ┌─────────────────┐  |
                          |  │  System B        │  |
                          |  │  (src/ + MUI)    │  |
                          |  │  Trip Dashboard  │  |
                          |  └─────────────────┘  |
                          +----------+------------+
                                     | REST & SSE
                                     v
                          +-----------------------+
                          |   FastAPI Backend     |
                          |   (app/api/)          |
                          | - /chat (Groq/Gemini) |
                          | - /plan (Gemini)      |
                          | - /trips/{id}         |
                          | - /voice/token        |
                          +---+---------------+---+
                              |               |
                   (Gemini)   |               |  (Cache / Rate Limit / Chat)
                              v               v
                     +-------------+   +-----------------+
                     |             |   |   Redis / Groq  |
                     | Gemini API  |   |   / Upstash     |
                     |             |   |                 |
                     +-------------+   +-----------------+
```

### Next.js 16 Proxy Pattern
API routes are guarded by `proxy.ts` (the Next.js 16 convention, replacing the deprecated `middleware.ts`). The proxy:
- Protects `/api/chat` routes with Clerk authentication.
- Returns `401 Unauthorized` for unauthenticated chat requests.
- Passes all other requests through without modification.

## Project Structure

```
WanderWay/
├── wanderway/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── routes/        # FastAPI route handlers
│   │   │   ├── core/              # Config, dependencies
│   │   │   ├── models/            # Pydantic schemas
│   │   │   ├── services/          # Gemini, Redis, PDF logic
│   │   │   └── main.py           # FastAPI app entrypoint
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── frontend/
│       ├── app/
│       │   ├── api/               # Next.js API route handlers
│       │   │   ├── chat/          # Chat endpoint (Groq)
│       │   │   ├── plan/          # Trip planning (Gemini)
│       │   │   └── trips/[id]/    # Trip retrieval
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/            # System A (Tailwind)
│       ├── lib/                   # Utilities, AI agent, Supabase
│       ├── public/
│       ├── src/                   # System B (MUI + Framer Motion)
│       ├── proxy.ts               # Next.js 16 auth middleware
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+ (or Docker)
- Redis (or Docker for `redis-stack`)
- A Google Gemini API key

### With Docker (recommended)
```bash
docker-compose up --build
```
Open http://localhost:3000.

### Without Docker

**1. Backend**
```bash
cd wanderway/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. Frontend**
```bash
cd wanderway/frontend
npm install
npm run dev
```

**3. Environment**
Copy `.env.example` to `.env.local` in both root and backend directories. Set at minimum:
- `GEMINI_API_KEY` — your Google Gemini API key
- `REDIS_URL` — `redis://localhost:6379` (or your Redis instance)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | System status and Redis connectivity |
| `POST` | `/api/v1/trips/plan` | Generate structured itinerary |
| `POST` | `/api/v1/stream/plan` | Generate itinerary via SSE |
| `GET` | `/api/v1/trips/{trip_id}` | Retrieve cached trip |
| `GET` | `/api/v1/trips/{trip_id}/pdf` | Download trip PDF |

FastAPI auto-generates Swagger docs at `http://localhost:8000/docs`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash` |
| `REDIS_URL` | Yes | Redis connection string |
| `CORS_ORIGINS` | No | Default: `["http://localhost:3000"]` |
| `MOCK_APIS` | No | Set `true` to mock external APIs in dev |
| `NEXT_PUBLIC_API_URL` | Yes | Browser-accessible FastAPI URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | No | Mapbox token for trip maps |
| `GROQ_API` | No | Groq API key for chat fallback |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk auth (chat protection) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (System A) | Next.js 16, Tailwind CSS, shadcn/ui |
| Frontend (System B) | MUI 5, Framer Motion |
| Backend | FastAPI, Pydantic v2, Uvicorn |
| LLM | Google Gemini 2.5 Flash |
| Chat fallback | Groq |
| Cache / Rate Limit | Redis (Upstash or local) |
| Auth (optional) | Clerk |
| Maps (optional) | Mapbox |
| Deployment | Docker Compose |

## Testing

```bash
# Backend
cd wanderway/backend && python -m pytest

# Frontend
cd wanderway/frontend && npm run lint
```

## How It Works
1. **User submits form:** The Next.js frontend sends a travel request (destination, dates, budget, interests) via REST or SSE.
2. **Rate limiter checks:** FastAPI verifies the request limit via Redis (10 req/min).
3. **Cache lookup:** Backend checks Redis for an identical request; returns instantly if found.
4. **Gemini generates itinerary:** FastAPI sends a schema-validated prompt to Gemini and returns the structured result.
5. **Streaming (optional):** The SSE endpoint streams Gemini's structured JSON chunks for real-time UI updates.
6. **PDF / Share:** Generated trips can be downloaded as PDF or shared via a unique URL.
