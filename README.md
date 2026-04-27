# CircleSave API

Digital ROSCA (Құты) Platform — automated rotating savings circles built on Express.js + Prisma + PostgreSQL + Redis.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Docs**: Swagger UI

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### 1. Clone and Install
git clone <your-repo-url>
cd circlesave-api
npm install


### 2. Environment Setup
cp .env.example .env.development


Fill in `.env.development`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/circlesave
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=5
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Infrastructure (Docker)
docker compose up -d

This starts PostgreSQL on port 5433 and Redis on port 6379.

### 4. Run Migrations
npx prisma migrate dev


### 5. Start Server
npm run dev


- Server: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/auth/register` | Register new user | No |
| POST | `/v1/auth/login` | Login with phone + password | No |
| POST | `/v1/auth/refresh` | Refresh access token | No |
| POST | `/v1/auth/logout` | Logout (revoke token) | Yes |

### Circles
| Method | Endpoint | Description | Role Required |
|--------|----------|-------------|---------------|
| GET | `/v1/circles` | List circles (paginated) | Any |
| POST | `/v1/circles` | Create new circle | ORGANIZER |
| GET | `/v1/circles/:id` | Get circle details | Member only |
| POST | `/v1/circles/:id/join` | Join a circle | Any |

### Ledger
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/circles/:id/ledger` | Get ledger entries | Yes |
| GET | `/v1/circles/:id/balance` | Get circle balance | Yes |

## Architecture Decisions

### Double-Entry Bookkeeping
Every financial transaction creates exactly 2 ledger records (debit + credit) in a single atomic PostgreSQL transaction. This guarantees that `sum(debits) = sum(credits)` at all times.

Example — member contributes 10,000 KZT:
- DEBIT: `MEMBER_RECEIVABLE` account, 10,000 KZT
- CREDIT: `CIRCLE_POT` account, 10,000 KZT

### Idempotency Keys
All financial operations generate a unique idempotency key stored in Redis with 24h TTL. This prevents duplicate payments even if the request is retried.

Key format: `circle:{id}:user:{id}:cycle:{n}:action:{type}`

### JWT Strategy
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days and are stored in Redis
- On logout, refresh token is deleted from Redis (revocation)
- On refresh, old token is rotated (new token issued, old deleted)

### RBAC (Role-Based Access Control)
Three roles enforced at middleware level:
- `MEMBER` — default role, can join circles
- `ORGANIZER` — can create and manage circles
- `ADMIN` — full platform access

Wrong role returns `403 Forbidden`, missing token returns `401 Unauthorized`.

### Cursor-Based Pagination
List endpoints use cursor-based pagination (no OFFSET) for consistent performance at scale.

### Rate Limiting
Auth endpoints (`/register`, `/login`) are limited to 5 requests per minute per IP using `express-rate-limit`.

## Running Tests
npm test

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | development / production / test |
| `PORT` | Yes | Server port (default 3000) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_ACCESS_SECRET` | Yes | Min 32 chars |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars |
| `JWT_ACCESS_EXPIRES_IN` | No | Default 15m |
| `JWT_REFRESH_EXPIRES_IN` | No | Default 7d |
| `RATE_LIMIT_WINDOW_MS` | No | Default 60000 |
| `RATE_LIMIT_MAX_REQUESTS` | No | Default 5 |
| `CORS_ORIGIN` | No | Default http://localhost:3000 |

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- No plaintext secrets in code
- JWT tokens signed with separate access/refresh secrets
- Rate limiting on auth endpoints
- Helmet.js for HTTP security headers
- CORS configured (wildcard disabled in production)