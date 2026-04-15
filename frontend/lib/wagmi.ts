'use client'

import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: { name: 'HashKey Explorer', url: 'https://testnet.hashkey.gold' },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [hashkeyTestnet],
  connectors: [
    injected({ shimDisconnect: true }),         // Rabby, MetaMask, any injected
    walletConnect({ projectId: 'identifi' }),    // WalletConnect
  ],
  transports: {
    [hashkeyTestnet.id]: http(),
  },
})
