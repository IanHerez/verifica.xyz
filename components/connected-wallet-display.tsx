"use client"

import { formatAddress } from "@/lib/web3-utils"
import { Copy, Check, LogOut } from "lucide-react"
import { useState } from "react"

interface ConnectedWalletDisplayProps {
  address: string
  onDisconnect: () => void
}

export function ConnectedWalletDisplay({ address, onDisconnect }: ConnectedWalletDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{formatAddress(address)}</p>
      </div>
      <button onClick={handleCopy} className="p-1 hover:bg-primary/20 rounded transition-colors" title="Copy address">
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
      </button>
      <button onClick={onDisconnect} className="p-1 hover:bg-primary/20 rounded transition-colors" title="Disconnect">
        <LogOut className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}
