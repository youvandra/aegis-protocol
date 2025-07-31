import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import App from './App.tsx';
import './index.css';
import { config, projectId } from './config/wagmi';

// Setup queryClient
const queryClient = new QueryClient();

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  enableSwaps: false,
  enableEmail: false,
  enableSocials: [],
  featuredWalletIds: [],
  includeWalletIds: [],
  excludeWalletIds: [],
  termsConditionsUrl: undefined,
  privacyPolicyUrl: undefined,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
