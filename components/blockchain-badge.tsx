"use client"

import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface BlockchainBadgeProps {
  status: "verified" | "pending" | "failed"
  hash?: string
}

export function BlockchainBadge({ status, hash }: BlockchainBadgeProps) {
  const config = {
    verified: {
      icon: CheckCircle2,
      text: "Verificado",
      color: "text-green-600 bg-green-50",
    },
    pending: {
      icon: Clock,
      text: "Pendiente",
      color: "text-yellow-600 bg-yellow-50",
    },
    failed: {
      icon: AlertCircle,
      text: "Fallido",
      color: "text-red-600 bg-red-50",
    },
  }

  const { icon: Icon, text, color } = config[status]

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{text}</span>
      {hash && <span className="text-xs opacity-75">#{hash.slice(-4)}</span>}
    </div>
  )
}
