# Aegis Protocol

Aegis Protocol is building the essential trust and asset management layer for the multi-trillion-dollar digital asset economy. This application provides a secure and automated way to manage digital asset transfers, ensuring assets reach the right people at the right time, even in unforeseen circumstances.

## Features

- **Stream**: Automate asset transfers with precise timing and logic, allowing users to stream wealth to designated recipients.
- **Legacy**: Create trustless legacy plans that activate based on predefined conditions (e.g., inactivity), ensuring permanent asset distribution without intermediaries.
- **Relay**: Facilitate synchronized smart transfers between parties, enabling secure and agreed-upon transactions without a middleman.

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

This project uses Supabase for its backend and Wagmi/Web3Modal for wallet integration, which require environment variables.

Create a `.env` file in the root of your project directory (if it doesn't already exist) and add the following variables:

```
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
VITE_WAGMI_PROJECT_ID="YOUR_WAGMI_PROJECT_ID"
```

- **`VITE_SUPABASE_URL`**: Your Supabase project URL. You can find this in your Supabase project settings under `API -> Project URL`.
- **`VITE_SUPABASE_ANON_KEY`**: Your Supabase public `anon` key. You can find this in your Supabase project settings under `API -> Project API keys`.
- **`VITE_WAGMI_PROJECT_ID`**: Your WalletConnect Cloud Project ID. You can obtain this from [WalletConnect Cloud](https://cloud.walletconnect.com/).

**Important**: Do not commit your `.env` file to version control. It is already included in `.gitignore`.

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
├── components/          # Reusable UI components
├── config/             # Configuration files (Wagmi, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase client)
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
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