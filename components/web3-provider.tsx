"use client"

import type { ReactNode } from "react"

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // This component wraps Reown AppKit initialization
  // Initialize AppKit with your project ID from Reown dashboard
  // https://cloud.reown.com/

  return (
    <div>
      {/* AppKit provider and modal will be initialized here */}
      {children}
    </div>
  )
}
