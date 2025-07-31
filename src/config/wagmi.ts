import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia } from 'wagmi/chains'
import { Chain } from 'wagmi'

// ✅ Define Hedera Testnet manually
export const hederaTestnet: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
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

// ✅ WalletConnect project ID
export const projectId = 'dd6934ed03aeebf4d1a21fb001d7c1f3'

// ✅ Dapp metadata
const metadata = {
  name: 'Aegis Protocol',
  description: 'Digital Asset Trust Layer',
  url: 'https://aegis-protocol.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

// ✅ Include Hedera Testnet in chains
const chains = [mainnet, sepolia, hederaTestnet] as const

// ✅ Final wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})
