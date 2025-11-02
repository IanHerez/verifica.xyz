"use client"

import { Card } from "@/components/ui/card"
import { BlockchainBadge } from "./blockchain-badge"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"

interface DocumentBlockchainCertProps {
  hash: string
  transactionHash?: string
  status: "verified" | "pending" | "failed"
  timestamp?: string
  chain?: string
}

export function DocumentBlockchainCert({
  hash,
  transactionHash,
  status,
  timestamp,
  chain = "Ethereum",
}: DocumentBlockchainCertProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-foreground mb-4">Certificado Blockchain</h3>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Estado</span>
          <BlockchainBadge status={status} />
        </div>

        {/* Document Hash */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Hash del Documento</p>
          <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
            <code className="text-xs text-muted-foreground flex-1 truncate">{hash}</code>
            <button onClick={handleCopy} className="p-2 hover:bg-muted rounded transition-colors">
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Transaction Hash */}
        {transactionHash && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Hash de Transacción</p>
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
              <code className="text-xs text-muted-foreground flex-1 truncate">{transactionHash}</code>
              <a
                href={`https://etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-muted rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}

        {/* Chain Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Red</p>
            <p className="font-medium text-foreground mt-1">{chain}</p>
          </div>
          {timestamp && (
            <div>
              <p className="text-sm text-muted-foreground">Certificado</p>
              <p className="font-medium text-foreground mt-1">{timestamp}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
