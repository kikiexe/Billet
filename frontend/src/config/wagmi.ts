import { http, createConfig } from 'wagmi'
import { baseSepolia, mainnet } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [baseSepolia, mainnet] as const,
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'dummy_project_id' }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [mainnet.id]: http('https://cloudflare-eth.com'),
  },
})
