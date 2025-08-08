import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { Chain } from 'wagmi/chains'
import { injected } from 'wagmi/connectors';

export const hederaTestnet: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 8,
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

export const projectId = 'dd6934ed03aeebf4d1a21fb001d7c1f3'

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
