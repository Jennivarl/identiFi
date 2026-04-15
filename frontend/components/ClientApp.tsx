'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import ConnectScreen from '@/components/ConnectScreen'
import { Providers } from '@/app/providers'

function AppInner() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()
  const { ready, authenticated, logout } = usePrivy()

  useEffect(() => {
    if (authenticated && !isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }, [authenticated, isConnected, connectors, connect])

  if (!ready) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isLoggedIn = isConnected || authenticated

  if (!isLoggedIn) {
    return <ConnectScreen />
  }

  return (
    <Dashboard
      address={(address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`}
      onDisconnect={() => { disconnect(); logout() }}
    />
  )
}

export default function ClientApp() {
  return (
    <Providers>
      <AppInner />
    </Providers>
  )
}
