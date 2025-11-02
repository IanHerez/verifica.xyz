"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WalletConnectCard } from "@/components/wallet-connect-card"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ENSSetupPage() {
  const [ensName, setEnsName] = useState("")
  const [step, setStep] = useState(1)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <Link href="/ens" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Volver</span>
            </Link>

            <h1 className="text-3xl font-bold text-foreground mb-2">Configurar tu ENS</h1>
            <p className="text-muted-foreground mb-8">Asocia tu identidad blockchain con un nombre ENS</p>

            {/* Steps */}
            <div className="space-y-6">
              {/* Step 1: Wallet */}
              <Card className={`p-6 border-2 ${step >= 1 ? "border-primary" : "border-border"}`}>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step > 1 ? "bg-green-600 text-white" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {step > 1 ? <Check className="w-5 h-5" /> : "1"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Conectar Wallet</h3>
                    <p className="text-sm text-muted-foreground mt-2">Conecta tu wallet de Ethereum</p>
                    <div className="mt-4">
                      <WalletConnectCard />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 2: ENS Name */}
              {step >= 2 && (
                <Card className="p-6 border-2 border-primary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary text-primary-foreground">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Elegir Nombre ENS</h3>
                      <p className="text-sm text-muted-foreground mt-2">Elige un nombre único para tu identidad</p>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Nombre ENS</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="tu-nombre"
                              value={ensName}
                              onChange={(e) => setEnsName(e.target.value)}
                              className="flex-1 px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                            />
                            <span className="px-4 py-2 rounded-lg bg-muted text-foreground">.eth</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 3: Review */}
              {step >= 3 && (
                <Card className="p-6 border-2 border-primary">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary text-primary-foreground">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Revisar y Confirmar</h3>
                      <p className="text-sm text-muted-foreground mt-2">Verifica la información antes de confirmar</p>
                      <Card className="mt-4 p-4 bg-muted">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Nombre ENS:</span>
                            <span className="text-sm font-medium text-foreground">{ensName}.eth</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Costo anual:</span>
                            <span className="text-sm font-medium text-foreground">0.01 ETH</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Anterior
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 2 && !ensName} className="flex-1">
                  Siguiente
                </Button>
              ) : (
                <Button className="flex-1">Confirmar y Pagar</Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
