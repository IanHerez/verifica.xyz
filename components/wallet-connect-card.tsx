"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Check } from "lucide-react"
import { useState } from "react"

export function WalletConnectCard() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")

  const handleConnect = async () => {
    // Simulated wallet connection
    setIsConnected(true)
    setAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E")
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Conectado
          </h3>
          {isConnected ? (
            <p className="text-sm text-green-600 mt-2">{address}</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Conecta tu wallet para continuar</p>
          )}
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Conectado</span>
          </div>
        ) : (
          <Button onClick={handleConnect}>Conectar</Button>
        )}
      </div>
    </Card>
  )
}
