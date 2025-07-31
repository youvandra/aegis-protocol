import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia } from 'wagmi/chains'

// Get projectId from https://cloud.walletconnect.com
export const projectId = 'YOUR_PROJECT_ID' // Replace with your actual project ID

const metadata = {
  name: 'Aegis Protocol',
  description: 'Digital Asset Trust Layer',
  url: 'https://aegis-protocol.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia] as const

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})