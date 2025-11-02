"use client"

import { useState, useCallback } from "react"

export interface Web3Context {
  address: string | null
  isConnected: boolean
  chainId: number | null
}

export function useWeb3() {
  const [web3Context, setWeb3Context] = useState<Web3Context>({
    address: null,
    isConnected: false,
    chainId: null,
  })

  const connect = useCallback(async () => {
    try {
      // Initialize connection with AppKit
      // This is a placeholder - actual implementation depends on Reown AppKit setup
      setWeb3Context({
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E",
        isConnected: true,
        chainId: 1,
      })
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }, [])

  const disconnect = useCallback(() => {
    setWeb3Context({
      address: null,
      isConnected: false,
      chainId: null,
    })
  }, [])

  return {
    ...web3Context,
    connect,
    disconnect,
  }
}
