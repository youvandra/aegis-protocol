# Aegis Protocol

Aegis Protocol is building the essential trust and asset management layer for the multi-trillion-dollar digital asset economy. This application provides a secure and automated way to manage digital asset transfers, ensuring assets reach the right people at the right time, even in unforeseen circumstances.

## Features

- **Stream**: Automate asset transfers with precise timing and logic, allowing users to stream wealth to designated recipients.
- **Legacy**: Record a legacy plan that activates on predefined conditions (e.g. inactivity) and describes how assets should be distributed.
- **Relay**: Facilitate synchronized smart transfers between parties — the sender pays the receiver directly, wallet to wallet.

### What is and is not on-chain today

This repository ships a web client and a Node server holding a SQLite database.
There are no smart contracts. Read that as:

- **Relay** settles peer-to-peer: the sender's wallet transfers HBAR straight to
  the receiver's EVM address. Approval is signed as EIP-712 and recorded on the
  Hedera Consensus Service.
- **Stream** is **custodial**. Scheduling a group transfers the group's total to
  the account in `VITE_HEDERA_ACCOUNT_ID`, and payout to members happens off
  this repository. Members rely on the protocol operator, not on code.
- **Legacy** holds no funds at all — a plan is database state plus an HCS record.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool for modern web projects.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **Wagmi**: A collection of React Hooks for Ethereum.
- **Web3Modal**: A library to easily connect web3 wallets.
- **Hono**: The HTTP server behind the API.
- **SQLite**: The database, through Node's built-in `node:sqlite` driver — no
  native build step, no database server to run.

## Architecture

One Node process serves everything: the API, the Hedera gateway, and the built
frontend. That means one origin, no CORS, one thing to deploy, and one place
where secrets live.

```
browser ──► Node server (Hono) ──► SQLite file
                   │
                   └────────────► Hedera (operator key, mirror node)
```

The operator key and the session store are server-side by construction. The
browser holds only a short-lived session token, in memory.

## Local Development Setup

### Prerequisites

- **Node.js 22.5 or newer** (24+ recommended). The database driver is
  `node:sqlite`, which ships with Node itself — there is nothing to compile.

### 1. Install dependencies

```bash
npm install && npm --prefix server install
```

### 2. Configure

Two env files, split by trust boundary:

```bash
cp .env.example .env && cp server/.env.example server/.env
```

`.env` holds only public values — Vite inlines every `VITE_` variable into the
JavaScript it serves, so **nothing secret may go there**. `server/.env` holds
the Hedera operator key and anything else that must stay off the wire.

| Variable | File | Notes |
| --- | --- | --- |
| `VITE_WAGMI_PROJECT_ID` | `.env` | [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `VITE_HEDERA_ACCOUNT_ID` | `.env` | Treasury account for stream deposits (public) |
| `VITE_API_URL` | `.env` | Only when the API is on another origin |
| `HEDERA_ACCOUNT_ID` | `server/.env` | Operator account |
| `HEDERA_PRIVATE_KEY` | `server/.env` | **Secret.** Pays for consensus topics and messages |
| `HEDERA_NETWORK` | `server/.env` | `testnet` (default) or `mainnet` |
| `DATABASE_PATH` | `server/.env` | SQLite file; must be on persistent storage |
| `STATIC_DIR` | `server/.env` | Where the built frontend lives |

### 3. Run

Two processes in development — Vite proxies `/api` to the server:

```bash
npm run dev:server
```

```bash
npm run dev
```

The app is at `http://localhost:5173`, the API at `http://localhost:8080`.
The database file and schema are created on first boot; there is no migration
step to run.

### 4. Build

```bash
npm run build:all
```

That produces `dist/` (frontend) and `server/dist/` (server). `npm start` then
serves both from one process on `PORT`.

## Deployment

The app runs on your own server. It is not deployable to Vercel or any other
serverless platform: SQLite needs a persistent filesystem and a long-lived
process, and serverless gives neither.

```bash
docker compose up -d --build
```

Compose reads the same variables from a root `.env`. Put the reverse proxy
(Caddy, nginx) in front of `127.0.0.1:8080` and terminate TLS there.

**Supervise with Docker and nothing else.** A pm2 entry or systemd unit *on top
of* Compose gives two supervisors restarting the same process, which is its own
class of outage.

### Backups

`litestream.yml` configures continuous replication of the SQLite file to any
S3-compatible bucket. Fill in the bucket and endpoint before going live — the
database is the only copy of every legacy plan, group and relay.

Restore into a fresh volume with:

```bash
litestream restore -o /data/aegis.db s3://YOUR-BUCKET/aegis
```

## API

All routes are under `/api`. Everything except `/api/health` and the two
`/api/auth` entry points requires `Authorization: Bearer <session token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/nonce` | Request a single-use sign-in challenge |
| `POST` | `/api/auth/verify` | Exchange a signature for a session token |
| `POST` | `/api/auth/sign-out` | Revoke the current session |
| `POST` | `/api/users/me/connect` | Record a connection (also the Legacy heartbeat) |
| `GET` | `/api/groups` | Stream groups owned by the caller |
| `POST` | `/api/groups` | Create a group |
| `POST` | `/api/groups/:id/members` | Add a member |
| `POST` | `/api/groups/:id/schedule` | Mark a group funded |
| `POST` | `/api/groups/:id/release` | Release a group |
| `GET` | `/api/relays` | Relays where the caller is sender or receiver |
| `POST` | `/api/relays` | Create a relay |
| `POST` | `/api/relays/:id/{approve,reject,execute,cancel}` | Advance a relay |
| `GET`/`PUT` | `/api/legacy/plan` | Read or save the caller's legacy plan |
| `GET`/`POST` | `/api/legacy/beneficiaries` | List or add beneficiaries |
| `POST` | `/api/hedera/topics` | Create a consensus topic |
| `POST` | `/api/hedera/messages` | Submit a consensus message |

## Project Structure

```
src/                    # Frontend
├── components/         # Reusable UI components
├── config/             # Wagmi / chain configuration
├── context/            # WalletSessionProvider — one wallet session per app
├── hooks/              # Custom React hooks
├── lib/                # API client, wallet auth, HBAR amount helpers
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Time and error formatting helpers
└── main.tsx            # Application entry point

server/src/             # API, Hedera gateway and static hosting
├── routes/             # One module per resource
├── auth.ts             # Nonce, signature verification, session middleware
├── db.ts               # SQLite connection and typed query helpers
├── hedera.ts           # Operator client and mirror node lookups
├── schema.sql          # The whole schema, applied on boot
└── index.ts            # Wiring and the SPA fallback
```

## Key Components

- **HomePage**: Landing page with hero section
- **StreamPage**: Manage automated asset transfers
- **LegacyPage**: Set up inheritance and beneficiaries
- **RelayPage**: Handle synchronized transfers
- **AestheticNavbar**: Navigation between different sections

## Wallet Integration

The application supports wallet connection through Web3Modal, which provides access to various wallet providers. The project is configured to work with:

- **Hedera Testnet**: Primary blockchain network
- **MetaMask**: Browser extension wallet
- **WalletConnect**: Protocol for connecting mobile wallets

## Database Schema

The application uses the following main tables:

- **users**: Wallet account management
- **groups**: Stream group definitions
- **members**: Group membership and allocations
- **legacy_plans**: Legacy plan configurations
- **beneficiaries**: Legacy plan beneficiaries
- **relays**: Relay transaction records
- **auth_nonces**: Single-use sign-in challenges
- **sessions**: Live session tokens

The schema lives in `server/src/schema.sql` and is applied on every boot. It is
written to be re-runnable, so a fresh deployment and an existing database take
the same path.

## Security Model

- **Authentication.** On connect, the wallet signs a single-use nonce. The
  server verifies the signature, resolves the Hedera account ID from the mirror
  node itself, and returns an opaque session token. The client never asserts
  which account it is.
- **Authorization.** Every route compares the session's wallet against the row
  it is about to touch. Relay transitions additionally check *who* may make them
  and *from which state*, so a party cannot skip a step by calling an endpoint
  out of order.
- **Why not Postgres RLS.** The previous version derived identity from an
  `X-Wallet-Address` request header the browser set on its own — anyone could
  read or write another wallet's rows with a single `curl`. Several tables also
  still carried `USING (true)` policies, and because policies combine with OR, a
  single permissive one silently defeated every strict policy on that table.
  Ownership as ordinary code has no equivalent failure mode.
- **Key custody.** The Hedera operator key exists only in the server's
  environment. If it was ever shipped in a `VITE_` variable, treat it as
  compromised and rotate the account.
- **Sessions.** Tokens are random, stored server-side so they can be revoked,
  expire after an hour, and are held in browser memory only — never
  `localStorage`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the Aegis Protocol team.

---

© Aegis Protocol 2025