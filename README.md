# Elite Ingressos — Desafio Elite Dev

Plataforma de eventos e ingressos: o organizador monta o cartaz a partir da [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) (ou cria o evento do zero), o cliente escolhe o lugar no mapa, paga de forma simulada e recebe um QR. Na entrada, a portaria valida o código uma vez.

O cliente vê **só o que está publicado**. Catálogo Ticketmaster, preço e capacidade ficam no painel do organizador.

## Sumário

- [O que o app faz](#o-que-o-app-faz)
- [Como rodar](#como-rodar)
- [Contas para avaliação](#contas-para-avaliação)
- [Percorrer o fluxo](#percorrer-o-fluxo)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API](#api)
- [Testes](#testes)
- [Decisões](#decisões)
- [Uso de IA](#uso-de-ia)
- [Deploy no Render](#deploy-no-render)
- [O que não entra neste recorte](#o-que-não-entra-neste-recorte)
- [Se algo não subir](#se-algo-não-subir)

## O que o app faz

| Papel | Faz |
| --- | --- |
| **Organizador** | Busca shows na Ticketmaster, publica no cartaz, cria evento próprio com banner, ajusta data/local/capacidade/preço e tira do ar (só se não houver venda em aberto). |
| **Cliente** | Navega e filtra o cartaz, escolhe até 6 assentos, simula pagamento aprovado ou recusado, vê o QR em Meus ingressos, compartilha por link e cancela para devolver o lugar. |
| **Portaria** | Escolhe o evento da fila e valida pela câmera ou pelo código. Resposta: válido, inválido, já utilizado ou evento errado. |

Há também mapa de assentos ao vivo no checkout (SSE; se a conexão cair, o front consulta de novo a cada 3 segundos).

## Como rodar

Pedido: **Node.js 20+**, **Yarn 1**, **Docker** (só para o Postgres local). Front e back sobem em terminais separados.

### 1. Banco

Na pasta `backend`:

```bash
cp .env.example .env
```

Preencha `TICKETMASTER_API_KEY` ([cadastro na Ticketmaster](https://developer.ticketmaster.com/)), `JWT_SECRET` e `TICKET_QR_SECRET`.

Suba o Postgres e aplique o schema:

```bash
yarn install
yarn docker:up
yarn prisma:deploy
yarn prisma:seed
```

`yarn docker:up` sobe só o PostgreSQL 16 na porta `5432` (`desafio` / `desafio` / banco `desafio_elite`). Se o `DATABASE_URL` no `.env` já apontar para um Postgres na nuvem (Neon, etc.), pule o Docker e rode só `deploy` + `seed`.

Para desligar o container: `yarn docker:down`.

### 2. Backend

Ainda em `backend`:

```bash
yarn start:dev
```

API: [http://localhost:3000/api](http://localhost:3000/api)

### 3. Frontend

Em outro terminal, na pasta `frontend`:

```bash
cp .env.example .env
yarn install
yarn dev
```

App: [http://localhost:5173](http://localhost:5173)

O `.env` do front já aponta para `http://localhost:3000/api`. O CORS do backend libera só `http://localhost:5173`.

## Contas para avaliação

Todas usam a senha **`senha123`**.

| Papel | E-mail | Para quê |
| --- | --- | --- |
| Organizador | `organizador@elite.dev` | Cartaz, catálogo e evento próprio |
| Cliente Ana | `cliente@elite.dev` | Comprar, ver QR, cancelar |
| Cliente Bruno | `cliente2@elite.dev` | Segundo cliente (compra no mesmo evento, mapa ao vivo) |
| Portaria | `portaria@elite.dev` | Validar na entrada |

Evento semeado: **Noite Elite — Rock na Arena**, 18/09/2026 às 21:00, Arena Elite, São Paulo, **R$ 150**, 96 lugares (8 fileiras × 12 assentos).

O cadastro pela tela cria só conta de **cliente**.

## Percorrer o fluxo

1. Abra [http://localhost:5173](http://localhost:5173) e entre como organizador. Publique um show do catálogo ou crie um evento próprio (banner é obrigatório nesse caso).
2. Saia e entre como **Cliente Ana**. Abra o evento, escolha lugares, use **Pagar e confirmar** e **Simular recusa**.
3. Em **Meus ingressos**, mostre o QR, compartilhe o link (abre sem login) e, se quiser, cancele para devolver o lugar.
4. Entre como **Portaria**, escolha o evento e leia o QR (ou digite o código). Escaneie de novo: deve virar “já utilizado”.
5. Mapa ao vivo: duas abas no mesmo checkout (Ana e Bruno). A compra de um some o assento no mapa do outro.

Tirar o evento do cartaz só funciona com **zero lugares vendidos**. Se alguém comprou, o cliente precisa cancelar antes (ou a venda permanece).

## Variáveis de ambiente

### `backend/.env`

| Variável | Uso |
| --- | --- |
| `PORT` | Porta da API (padrão `3000`) |
| `DATABASE_URL` | Conexão Prisma/PostgreSQL |
| `POSTGRES_*` | User, senha, banco e porta do `docker compose` |
| `TICKETMASTER_API_KEY` | Discovery API (busca do organizador) |
| `JWT_SECRET` | Assinatura do token de sessão |
| `TICKET_QR_SECRET` | HMAC do payload do QR (sem isso o código é fácil de forjar) |

### `frontend/.env`

| Variável | Uso |
| --- | --- |
| `VITE_API_URL` | Base da API (`http://localhost:3000/api` no local) |

Banners de evento próprio ficam em `backend/uploads/` e o Nest serve em `/uploads/`.

## API

Prefixo `/api`.

| Método | Caminho | Quem |
| --- | --- | --- |
| `POST` | `/auth/login` `/auth/register` | público |
| `GET` | `/auth/me` | autenticado |
| `GET` | `/events` `/events/:id` `/events/:id/seating` | público (só publicado) |
| `GET` | `/events/:id/seating/stream` | público (SSE do mapa) |
| `POST` | `/reservations` | cliente (`paymentOutcome`: `approve` ou `decline`) |
| `GET` | `/tickets/me` | cliente |
| `POST` | `/tickets/:id/share` `/tickets/:id/cancel` | cliente |
| `GET` | `/tickets/shared/:token` | público |
| `POST` | `/tickets/validate` | portaria |
| `GET` | `/gate/events` | portaria |
| `POST` | `/gate/validate` | portaria |
| `GET/POST/PATCH/DELETE` | `/organizer/...` | organizador |

Há também rotas de catálogo Ticketmaster usadas pelo painel (`/organizer/catalog`) e proxies auxiliares (`/venues`, `/attractions`, `/classifications`, `/suggest`).

## Testes

```bash
cd backend && yarn test
cd frontend && yarn test
```

No back: Jest nos serviços (reserva sem vender duas vezes, QR, portaria, cancelamento, stream do mapa).  
No front: Vitest + Testing Library (login, papéis, mapa, pagamento simulado, cancelar na modal).

## Decisões

- **Ticketmaster, não TMDb.** O PDF pede uma das duas. O recorte é show ao vivo, não cinema; a Discovery API já traz nome, data, casa e cidade.
- **Mapa de assentos, não pista.** Um dos dois bastava. O mapa deixa claro o “mesmo lugar não vende duas vezes” e cabe no checkout.
- **Preço no catálogo.** Muitos eventos BR da Ticketmaster vêm sem `priceRanges`. O back devolve um valor estável em BRL para o organizador não publicar “de graça”.
- **Lista pública = só publicado.** O cliente não navega o catálogo cru da Ticketmaster.
- **QR assinado (HMAC).** O código sozinho não basta; a portaria confere a assinatura. Ingresso cancelado vira inválido, não um quinto status na porta.
- **Cancelar guarda o histórico.** O ingresso fica `CANCELLED`, o assento volta a `AVAILABLE` e pode ser vendido de novo. Fileira e número ficam no próprio ingresso.
- **Mapa ao vivo por SSE.** Só o servidor precisa falar (ocupou / liberou). WebSocket seria mais peça para o mesmo recado. Se o EventSource cair, o checkout volta a puxar o mapa a cada 3 s.
- **Debounce na busca (400 ms).** Texto e cidade só disparam a API depois que a pessoa para de digitar. Sem isso, cada tecla vira uma chamada (cartaz público e catálogo do organizador).
- **Pedido antigo some.** A busca usa `AbortController`: se o filtro muda de novo, a resposta velha não pinta a lista.
- **Ticketmaster no máximo 2 páginas ao mesmo tempo.** O catálogo do organizador precisa de várias páginas; o limite evita a Discovery recusar por excesso. Não é load balancer: é teto de concorrência numa API de terceiros.
- **Modal própria, não `window.confirm`.** Cancelar ingresso e tirar do cartaz usam o mesmo componente do app.
- **Erros em português.** Queda de rede não aparece como `Failed to fetch`.
- **Contas de teste só no README.** A tela de entrar não mostra e-mail nem senha.
- **Visual vinho / creme / dourado.** Para não ficar com layout apagado.

## Uso de IA

Ferramenta: **Cursor** (agente no editor), ao longo da semana, para acelerar o que já estava desenhado — módulos Nest, telas React, testes e este README.

**Onde a IA entrou de fato**

- **Mapa de assentos e ingressos:** layout do mapa de ingressos, QR, mapa ao vivo (SSE + aviso se o lugar escolhido sair).
- **Documentação:** este README (passo a passo, contas, rotas e o que não entra no recorte).
- **Agilidade para montar o código:** arquivos specs, CSS e o encadeamento lista → detalhe.

**O que não foi “a IA escolheu sozinha”**

Papéis (organizador / cliente / portaria), boilerplate de módulos, cartaz só com publicado, Ticketmaster em vez de filme, mapa em vez de pista, HMAC no QR, modal no lugar do alerta do navegador, paleta e textos em português.

Na busca: **debounce de 400 ms** em texto e cidade (não uma request por tecla), **cancelar o pedido antigo** quando o filtro muda, e **no máximo duas páginas da Ticketmaster ao mesmo tempo** — teto de concorrência, não balanceamento de carga. No checkout, **SSE** no mapa (com consulta a cada 3 s se a conexão cair) em vez de WebSocket. No ingresso, **cancelar devolve o lugar** e guarda fileira/número no histórico. Erros saem em português pelo filtro da API; contas de avaliação ficam no README, não na tela de entrar. Material UI entrou só nos filtros, não no app inteiro.


Não há spec/PRD versionado à parte: o histórico de commits no GitHub é o rastro do processo.

## Deploy no Render

Front e back sobem como dois serviços no mesmo GitHub ([`render.yaml`](render.yaml)): site estático (Vite) e Web Service (Nest).

1. Banco na nuvem: [Neon](https://console.neon.tech) → Postgres e `DATABASE_URL` (*pooled*).
2. No [Render](https://dashboard.render.com): **New → Blueprint** → este repositório. O dashboard pede as variáveis com `sync: false`:

   | Serviço | Chave | Valor |
   | --- | --- | --- |
   | API | `DATABASE_URL` | URL do Neon |
   | API | `TICKETMASTER_API_KEY` | chave da Discovery |
   | API | `JWT_SECRET` | texto longo e aleatório |
   | API | `TICKET_QR_SECRET` | outro texto longo e aleatório |
   | API | `FRONTEND_ORIGIN` | URL HTTPS do site estático (depois que ele subir) |
   | Web | `VITE_API_URL` | `https://<api>.onrender.com/api` |

3. Schema e contas de teste no Neon (no seu PC, com o `.env` da API apontando para o Neon):

```bash
cd backend
yarn prisma:deploy
yarn prisma:seed
```

4. Depois que a API tiver URL, coloque `VITE_API_URL` no serviço estático e **Manual Deploy** no front (o Vite grava a URL no build).

No plano grátis a API dorme após ~15 min sem acesso; o primeiro hit pode demorar até um minuto.

## O que não entra neste recorte

O PDF pede para **não** fazer: nota fiscal, revenda entre usuários, app nativo, recuperação de senha e envio de ingresso por e-mail.

Também não há:

- **Docker Compose do front + back.** O compose sobe só o Postgres. API e Vite continuam no `yarn` local.
- **Provedor de pagamento real.** A cobrança é simulada (`approve` / `decline`), como o enunciado permite.

A busca do organizador na Ticketmaster pede no máximo 1000 eventos (páginas de 200, duas chamadas ao mesmo tempo) para não estourar a API.

## Se algo não subir

- **`TICKETMASTER_API_KEY` vazia:** o cartaz do seed funciona; a busca do organizador no catálogo falha.
- **Porta 5432 ocupada:** mude `POSTGRES_PORT` e o host em `DATABASE_URL`, ou use um Postgres já existente.
- **Prisma reclama de migration:** `yarn prisma:deploy` em `backend` (precisa do banco no ar).
- **Front “não conecta”:** confira se a API está em `:3000` e se `VITE_API_URL` está igual ao `.env.example`.
- **QR inválido depois de mudar o `.env`:** `TICKET_QR_SECRET` diferente invalida os QRs já emitidos. Gere o ingresso de novo.
- **Yarn no front com `yarn dev` aberto (Windows):** às vezes o Vite trava o binding nativo e o `yarn install` falha com `EPERM`. Pare o `yarn dev` e rode o `yarn` de novo.
- **Render 502 no primeiro acesso:** a API grátis dormiu. Espere o cold start (~1 min) e recarregue.
- **Tirar do cartaz bloqueado:** ainda há lugar vendido. Cancele os ingressos ou deixe a venda no mural, de propósito.

Estrutura do repositório: `backend/` (NestJS + Prisma + PostgreSQL) e `frontend/` (React + Vite).
