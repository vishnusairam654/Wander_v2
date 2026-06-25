# WanderWay
> AI-powered travel planning with real-time streaming

![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=google-gemini&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## Features
- **SSE streaming:** Real-time generation of trip itineraries using Server-Sent Events.
- **Redis caching with TTL:** Fast retrieval of previously generated trips, reducing latency and API costs.
- **Rate limiting:** Protects the API from abuse using Redis-based rate limiting (e.g., 10 requests per minute).
- **PDF export:** Generate and download a beautifully formatted PDF itinerary on the fly.
- **Trip sharing:** Easily share generated itineraries with others via unique trip IDs.
- **Type-safe API:** End-to-end type safety with Pydantic models in Python and TypeScript interfaces in Next.js.

## Architecture
```text
           +------------------+
           |                  |
           |   Next.js (UI)   |
           |                  |
           +--------+---------+
                    | (REST & SSE)
                    v
           +------------------+
           |                  |
           | FastAPI Backend  |
           |                  |
           +---+----------+---+
               |          |
    (Prompt)   |          | (Cache / Rate Limit)
               v          v
    +-------------+   +---------+
    |             |   |         |
    | Gemini API  |   |  Redis  |
    |             |   |         |
    +-------------+   +---------+
```

## Quick Start
1. Clone the repository and navigate to the root directory.
2. Create `.env` files based on the required environment variables.
3. Run the following command:
```bash
docker-compose up --build
```
4. Open your browser and navigate to `http://localhost:3000`.

## API Docs
FastAPI auto-generates Swagger documentation. Once running, visit: `http://localhost:8000/docs`

**Endpoints:**
- `GET /health` - System status and Redis connectivity check.
- `POST /plan` - Generate a new trip (standard JSON response).
- `POST /plan/stream` - Generate a new trip using Server-Sent Events (SSE) streaming.
- `GET /{trip_id}` - Retrieve an existing trip from the Redis cache.
- `GET /{trip_id}/pdf` - Generate and download a PDF version of the trip.

## Environment Variables
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key used for generating the itineraries. |
| `REDIS_URL` | Connection string for Redis (e.g., `redis://redis:6379/0`). |
| `NEXT_PUBLIC_API_URL` | URL where the frontend communicates with the backend (e.g., `http://localhost:8000/api`). |

## Project Structure
```text
WanderWay/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml
└── README.md
```

## How It Works
1. **User submits form:** The Next.js frontend sends a customized travel request (destination, style, budget, interests).
2. **Rate limiter checks:** The FastAPI backend verifies the user's request limit via Redis before proceeding.
3. **Cache lookup:** The backend checks Redis for an identical request to return a cached response instantly.
4. **Gemini streams response & SSE to frontend:** If not cached, the request is sent to the Gemini API, which streams the response back to FastAPI. FastAPI then streams it to the Next.js UI using Server-Sent Events (SSE). The final complete result is then cached in Redis for future requests.
"# Wander_v2" 
