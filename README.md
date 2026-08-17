# Desafio Elite Dev

Plataforma de Eventos e Ingressos

## Estrutura

```
Desafio-Elite-Dev/
├── backend/     # NestJS + Ticketmaster + Neon
├── frontend/    # React + Vite (página de eventos)
└── README.md
```

## Backend

```bash
cd backend
cp .env.example .env
yarn install
yarn start:dev
```

API: `http://localhost:3000/api`

## Frontend

```bash
cd frontend
cp .env.example .env
yarn install
yarn dev
```

App: `http://localhost:5173` — listagem de eventos via `GET /api/events`.
