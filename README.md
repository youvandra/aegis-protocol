# Aegis Protocol

Aegis Protocol is building the essential trust and asset management layer for the multi-trillion-dollar digital asset economy. This application provides a secure and automated way to manage digital asset transfers, ensuring assets reach the right people at the right time, even in unforeseen circumstances.

## Features

- **Stream**: Automate asset transfers with precise timing and logic, allowing users to stream wealth to designated recipients.
- **Legacy**: Record a legacy plan that activates on predefined conditions (e.g. inactivity) and describes how assets should be distributed.
- **Relay**: Facilitate synchronized smart transfers between parties — the sender pays the receiver directly, wallet to wallet.

### What is and is not on-chain today

This repository ships a web client, a Supabase database and two Supabase edge
functions. There are no smart contracts. Read that as:

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
- **Supabase**: An open-source Firebase alternative providing a PostgreSQL database, authentication, and more.

## Local Development Setup

Follow these steps to get the Aegis Protocol project running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
- **npm** (Node Package Manager) or **Yarn**: npm comes with Node.js, or you can install Yarn globally (`npm install -g yarn`).

### 1. Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone <repository-url>
cd aegis-protocol
```

Replace `<repository-url>` with the actual URL of your Git repository.

### 2. Install Dependencies

Navigate into the project directory and install the required dependencies:

```bash
npm install
# or
yarn install
```

### 3. Environment Variables Setup

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project settings, `API -> Project URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings, `API -> Project API keys` |
| `VITE_WAGMI_PROJECT_ID` | [WalletConnect Cloud](https://cloud.walletconnect.com/) |
| `VITE_HEDERA_ACCOUNT_ID` | The Hedera account that receives scheduled stream deposits |
| `VITE_HEDERA_MIRROR_NODE_URL` | Optional; defaults to the public testnet mirror node |

**Never put a private key in a `VITE_` variable.** Vite inlines every `VITE_`
value into the JavaScript it serves, so anything named that way is readable by
any visitor. The Hedera operator key belongs in the edge function secrets below.

`.env` is gitignored; `.env.example` is the template that is committed.

### 4. Database Setup (Supabase)

This project relies on a Supabase PostgreSQL database. The schema is defined by migrations.

1. **Create a Supabase Project**: If you don't have one, create a new project on [Supabase](https://supabase.com/).
2. **Run Migrations**: The project's database schema is managed via Supabase migrations. You will need to apply these migrations to your Supabase project. Typically, you would use the Supabase CLI for this:

   ```bash
   # Ensure you have the Supabase CLI installed:
   # npm install -g supabase
   # or brew install supabase/supabase/supabase

   supabase login
   supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
   supabase db push
   ```

   Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference (found in your project URL or settings).

### 4b. Edge Functions (required)

Two functions hold everything that must not run in a browser. Deploy them and
set their secrets **before** applying the `verified_wallet_rls` migration —
afterwards the database only trusts callers holding a signed session.

```bash
supabase functions deploy hcs wallet-auth
```

```bash
supabase secrets set HEDERA_ACCOUNT_ID="0.0.YOUR_ACCOUNT" HEDERA_PRIVATE_KEY="YOUR_ECDSA_KEY" HEDERA_NETWORK="testnet"
```

- **`hcs`** — creates Hedera Consensus Service topics and submits messages. It
  is the only place the operator key exists.
- **`wallet-auth`** — issues a single-use nonce, verifies the wallet's signature
  over it, resolves the Hedera account ID from the mirror node, and mints a
  short-lived JWT whose `wallet_address` claim the RLS policies key on.
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` are
  injected automatically.

Set `ALLOWED_ORIGIN` to your deployed origin to restrict CORS beyond `*`.

### 5. Run the Development Server

Once all dependencies are installed and environment variables are set, you can start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the Vite development server, usually at `http://localhost:5173`. The application will automatically reload when you make changes to the source code.

### 6. Build for Production

To create a production-ready build of the application:

```bash
npm run build
# or
yarn build
```

This command compiles the application into the `dist` directory, ready for deployment.

## Project Structure

```
src/
├── components/         # Reusable UI components
├── config/             # Configuration files (Wagmi, etc.)
├── context/            # WalletSessionProvider — one wallet session per app
├── hooks/              # Custom React hooks
├── lib/                # Supabase client, wallet auth, Hedera + HCS helpers
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Time and error formatting helpers
└── main.tsx            # Application entry point

supabase/
├── functions/hcs/          # Hedera Consensus Service gateway (holds operator key)
├── functions/wallet-auth/  # Nonce + signature verification, mints session JWTs
└── migrations/             # Database schema and RLS policies
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
- **auth_nonces**: Single-use sign-in challenges (service role only)

## Security Model

- **Authentication.** On connect, the wallet signs a single-use nonce. The
  `wallet-auth` function verifies the signature and returns a JWT; that token is
  attached to every PostgREST request. Row Level Security reads the wallet from
  `auth.jwt() ->> 'wallet_address'`, a claim the database validated itself.
- **Why this replaced the old scheme.** Policies used to trust an
  `X-Wallet-Address` request header the browser set on its own, so any caller
  could read or write another wallet's rows with a single `curl`. The
  `20260826090000_verified_wallet_rls` migration drops every such policy, along
  with the leftover `USING (true)` policies that silently overrode the strict
  ones.
- **Key custody.** The Hedera operator key lives only in edge function secrets.
  If it was ever shipped in a `VITE_` variable, treat it as compromised and
  rotate the account.
- **Session lifetime.** Tokens last one hour and are held in memory only, so
  closing the tab ends the session.

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