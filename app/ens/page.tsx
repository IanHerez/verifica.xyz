"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Network, ExternalLink, Copy, Check, RefreshCw, Wallet } from "lucide-react"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useEmailENS } from "@/hooks/use-email-ens"
import { formatAddress } from "@/lib/web3-utils"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ENSPage() {
  const { authenticated, ready } = usePrivy()
  const { walletAddress, loading: walletLoading, refresh, hasEmbeddedWallet } = useUserWallet()
  const {
    ensName: finalENS,
    emailENS,
    walletENS,
    loading: ensLoading,
    associateENS,
    removeAssociation,
    checkENSAvailability,
    refresh: refreshENS,
    userEmail,
    hasEmailAssociation,
  } = useEmailENS()
  const [ensInput, setEnsInput] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRefresh = async () => {
    await refresh()
    await refreshENS()
    toast.success("Información actualizada")
  }

  const handleAssociateENS = async () => {
    if (!ensInput.trim()) {
      toast.error("Ingresa un nombre ENS")
      return
    }

    setIsChecking(true)
    try {
      // Verificar disponibilidad
      const check = await checkENSAvailability(ensInput.trim())
      if (!check.available) {
        toast.error(check.reason || "ENS no disponible")
        setIsChecking(false)
        return
      }

      // Asociar ENS al email
      const success = await associateENS(ensInput.trim())
      if (success) {
        toast.success(`ENS ${ensInput.trim()} asociado a tu email`)
        setEnsInput("")
      } else {
        toast.error("Error al asociar ENS")
      }
    } catch (error) {
      toast.error("Error al verificar ENS")
    } finally {
      setIsChecking(false)
    }
  }

  const handleRemoveAssociation = () => {
    removeAssociation()
    toast.success("Asociación ENS eliminada")
  }

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success("Dirección copiada")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegisterENS = () => {
    window.open("https://app.ens.domains/", "_blank")
    toast.info("Visita ens.domains para registrar tu dominio ENS")
  }

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="p-8 text-center max-w-md">
              <p className="text-muted-foreground">Cargando...</p>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Gestión ENS</h1>
              <p className="text-muted-foreground mt-1">Conecta y gestiona tu identidad blockchain</p>
            </div>

            {/* Información de Wallet */}
            {walletAddress ? (
              <Card className="p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Tu Wallet</h3>
                      <p className="text-sm text-muted-foreground">
                        {hasEmbeddedWallet ? "Wallet embebida de Privy" : "Wallet externa"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={walletLoading || ensLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${walletLoading || ensLoading ? "animate-spin" : ""}`} />
                    Actualizar
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Dirección</p>
                      <p className="font-mono text-sm text-foreground">{formatAddress(walletAddress)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {finalENS ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          ENS {hasEmailAssociation ? "(Email)" : "(Wallet)"}
                        </p>
                        <p className="font-semibold text-foreground">{finalENS}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Dominio ENS</p>
                        <p className="text-sm text-foreground">No configurado</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center mb-6">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Wallet className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Wallet no conectada</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {walletLoading
                    ? "Cargando información de wallet..."
                    : "Inicia sesión con Privy para obtener tu wallet embebida automáticamente"}
                </p>
                {!walletLoading && (
                  <Button onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Intentar nuevamente
                  </Button>
                )}
              </Card>
            )}

            {/* Información de Email y ENS */}
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">ENS por Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Asocia un ENS a tu email: {userEmail || "No disponible"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {emailENS ? (
                  <>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">ENS asociado a tu email:</p>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <p className="font-semibold text-lg text-foreground">{emailENS}</p>
                      {walletAddress && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Wallet: {formatAddress(walletAddress)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleRefresh} variant="outline" className="flex-1" disabled={ensLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${ensLoading ? "animate-spin" : ""}`} />
                        Actualizar
                      </Button>
                      <Button onClick={handleRemoveAssociation} variant="outline" className="text-destructive">
                        Eliminar asociación
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="ens-input">Nombre ENS (ej: tu-nombre.eth)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="ens-input"
                            value={ensInput}
                            onChange={(e) => setEnsInput(e.target.value)}
                            placeholder="mi-nombre.eth"
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAssociateENS()
                              }
                            }}
                          />
                          <Button onClick={handleAssociateENS} disabled={isChecking || !ensInput.trim()}>
                            {isChecking ? "Verificando..." : "Asociar"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ingresa un ENS que ya esté registrado en blockchain
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-foreground">
                          <strong>Nota:</strong> El ENS debe estar registrado en blockchain. Si no tienes uno,{" "}
                          <button onClick={handleRegisterENS} className="text-primary underline">
                            regístralo en ens.domains
                          </button>
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* ENS de Wallet (Fallback) */}
            {walletENS && !emailENS && (
              <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">ENS de Wallet (Fallback)</h3>
                    <p className="text-sm text-muted-foreground">ENS detectado de tu wallet</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold text-foreground">{walletENS}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este ENS se muestra si no tienes uno asociado a tu email
                  </p>
                </div>
              </Card>
            )}

            {/* ENS Final mostrado */}
            {finalENS && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">ENS Activo</h3>
                    <p className="text-sm text-muted-foreground">Este es el ENS que se muestra en la aplicación</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">ENS Final (Prioridad: Email → Wallet)</p>
                  <p className="font-bold text-xl text-foreground">{finalENS}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {hasEmailAssociation
                      ? "✅ Asociado a tu email"
                      : walletENS
                        ? "📱 De tu wallet"
                        : "Sin ENS configurado"}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
