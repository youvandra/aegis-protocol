import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { Chain } from 'wagmi/chains'
import { injected } from 'wagmi/connectors';

export const hederaTestnet: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    // Hedera's JSON-RPC relay reports value in weibar (18 decimals), not
    // tinybar. Declaring 8 here made every balance read 10^10 too large.
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
}

export const projectId = import.meta.env.VITE_WAGMI_PROJECT_ID as string

if (!projectId) {
  throw new Error('Missing VITE_WAGMI_PROJECT_ID environment variable')
}

const metadata = {
  name: 'Aegis Protocol',
  description: 'Digital Asset Trust Layer',
  url: 'https://aegis-protocol.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

const chains = [hederaTestnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  connectors: [injected()],
  metadata,
})
