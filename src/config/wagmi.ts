import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia, hedera } from 'wagmi/chains'
import { Chain } from 'wagmi'
import { hederaTestnet } from '.'
// Get projectId from https://cloud.walletconnect.com
export const projectId = 'dd6934ed03aeebf4d1a21fb001d7c1f3' // Replace with your actual project ID

export const hederaTestnet: Chain = {
  id: 296, // Chain ID for Hedera Testnet
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

const metadata = {
  name: 'Aegis Protocol',
  description: 'Digital Asset Trust Layer',
  url: 'https://aegis-protocol.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}


export const config = defaultWagmiConfig({
  hederaTestnet,
  projectId,
  metadata,
})