import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia, hedera } from 'wagmi/chains'
import { hederaTestnet } from './chain'
// Get projectId from https://cloud.walletconnect.com
export const projectId = 'dd6934ed03aeebf4d1a21fb001d7c1f3' // Replace with your actual project ID

const metadata = {
  name: 'Aegis Protocol',
  description: 'Digital Asset Trust Layer',
  url: 'https://aegis-protocol.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia, hedera, hederaTestnet] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})