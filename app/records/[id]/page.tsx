"use client"

import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Download, Share2, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

export default function RecordDetailPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E"
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    toast.success("Descargando certificado...")
    // Implementar descarga real
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Certificado Académico",
          text: "Mi certificado académico verificado en blockchain",
          url: window.location.href,
        })
        .then(() => toast.success("Compartido"))
        .catch(() => toast.error("Error al compartir"))
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Enlace copiado")
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link href="/records" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Volver a Registros</span>
            </Link>

            {/* Main Card */}
            <Card className="p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Licenciatura en Ingeniería de Software</h1>
                  <p className="text-muted-foreground mt-2">Universidad Nacional Autónoma</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="text-lg font-semibold text-green-600 mt-2">Completado</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Año</p>
                  <p className="text-lg font-semibold text-foreground mt-2">2023</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-lg font-semibold text-foreground mt-2">9.2/10</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Cursadas</p>
                  <p className="text-lg font-semibold text-foreground mt-2">3,600</p>
                </div>
              </div>
            </Card>

            {/* Blockchain Verification */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Verificación Blockchain</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Estado: Verificado</p>
                    <p className="text-xs text-muted-foreground">Certificado en Ethereum</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-xs text-muted-foreground flex-1 truncate">
                    0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E
                  </code>
                  <button onClick={handleCopy} className="p-2 hover:bg-background rounded transition-colors">
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
