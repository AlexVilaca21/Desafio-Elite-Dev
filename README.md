# Desafio Elite Dev

Plataforma de Eventos e Ingressos — catálogo Ticketmaster, compra com mapa de assentos e pagamento simulado.

## Estrutura

```
Desafio-Elite-Dev/
├── backend/     # NestJS + Prisma + PostgreSQL + Ticketmaster
├── frontend/    # React + Vite
└── README.md
```


Variáveis do banco em `backend/.env`:

```
DATABASE_URL=postgresql://desafio:desafio@localhost:5432/desafio_elite
POSTGRES_DB=desafio_elite
POSTGRES_USER=desafio
POSTGRES_PASSWORD=desafio
POSTGRES_PORT=5432
```

## Backend

```bash
cd backend
yarn install
yarn start:dev
```

API: `http://localhost:3000/api`

Rotas principais:

- `GET /api/events` — busca no catálogo Ticketmaster
- `GET /api/events/:id` — detalhe do evento
- `GET /api/events/:id/seating` — mapa de assentos
- `POST /api/reservations` — reserva + pagamento simulado (`paymentOutcome`: `approve` ou `decline`)

## Frontend

```bash
cd frontend
cp .env.example .env
yarn install
yarn dev
```

App: `http://localhost:5173`

