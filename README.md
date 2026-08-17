# Desafio Elite Dev

Plataforma de Eventos e Ingressos

## Estrutura do monorepo

```
Desafio-Elite-Dev/
├── backend/          # NestJS (Yarn)
└── README.md
```

## Backend (NestJS)


```
backend/src/
├── app.module.ts
├── main.ts
└── modules/
    ├── events/                     
    │   ├── dto/
    │   ├── events.controller.ts
    │   ├── events.controller.spec.ts
    │   ├── events.service.ts
    │   ├── events.service.spec.ts
    │   └── events.module.ts
    └── service/                     
        └── ticketmaster/
            ├── interfaces/
            ├── ticketmaster.service.ts
            ├── ticketmaster.service.spec.ts
            └── ticketmaster.module.ts
```

### Configuração

```bash
cd backend
cp .env.example .env
yarn install
```

### Executar

```bash
yarn start:dev
```

A API sobe em `http://localhost:3000/api`.

### Rotas — Events

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/events` | Busca eventos no catálogo Ticketmaster |
| GET | `/api/events/:id` | Detalhes de um evento |.

```bash
curl "http://localhost:3000/api/events?keyword=rock&city=S%C3%A3o%20Paulo&size=10"
```

### Testes

```bash
yarn test
yarn test:cov
```
