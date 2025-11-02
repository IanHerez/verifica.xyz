"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, CheckCircle2, XCircle, Clock, Shield, FileText, ExternalLink, Copy, Check } from "lucide-react"
import Link from "next/link"

interface VerificationResult {
  isVerified: boolean
  documentName?: string
  institution?: string
  issueDate?: string
  publicationDate?: string
  transactionHash?: string
  documentHash?: string
  status: "verified" | "pending" | "unverified"
  confidence?: number
  documentId?: string
  ipfsCid?: string
  ipfsUrl?: string
}

export default function VerifyPage() {
  const [searchInput, setSearchInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchInput.trim()) return

    setIsSearching(true)
    setSearchPerformed(true)

    try {
      // Consultar API real de verificación
      const response = await fetch(`/api/verify?hash=${encodeURIComponent(searchInput.trim())}`)

      if (!response.ok) {
        throw new Error("Error verificando documento")
      }

      const data = await response.json()

      if (data.isVerified === false && data.status === "unverified") {
        // Documento no encontrado
        setVerificationResult({
          isVerified: false,
          status: "unverified",
          confidence: 0,
        })
      } else {
        // Documento encontrado
        const document = data.document
        const firstFile = document.files?.[0]
        
        setVerificationResult({
          isVerified: data.isVerified,
          status: data.status,
          documentName: document.title,
          institution: document.institution,
          issueDate: document.issueDate,
          publicationDate: new Date(document.createdAt).toISOString().split("T")[0],
          documentHash: firstFile?.hash || searchInput.trim(),
          confidence: data.confidence || (data.isVerified ? 99 : 50),
          // Metadata adicional del documento
          documentId: document.id,
          ipfsCid: firstFile?.ipfsCid,
          ipfsUrl: firstFile?.ipfsUrl,
        })
      }
    } catch (error) {
      console.error("Error verificando:", error)
      setVerificationResult({
        isVerified: false,
        status: "unverified",
        confidence: 0,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderVerificationBadge = (status: string) => {
    const config = {
      verified: {
        icon: CheckCircle2,
        text: "Verificado",
        color: "text-green-600 bg-green-50",
        borderColor: "border-green-200",
      },
      pending: {
        icon: Clock,
        text: "Pendiente de Verificación",
        color: "text-yellow-600 bg-yellow-50",
        borderColor: "border-yellow-200",
      },
      unverified: {
        icon: XCircle,
        text: "No Encontrado",
        color: "text-red-600 bg-red-50",
        borderColor: "border-red-200",
      },
    }

    const config_item = config[status as keyof typeof config] || config.unverified
    const Icon = config_item.icon

    return (
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${config_item.color} ${config_item.borderColor}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold">{config_item.text}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <Image
              src="/verifica logo.png"
              alt="Verifica Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <span>Verifica</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm hover:text-primary transition-colors">
              Inicio
            </a>
            <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">
              Cómo Funciona
            </a>
            <Link href="/">
              <Button variant="outline" className="bg-transparent">
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Verificación Pública</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Verifica la Autenticidad de Documentos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Cualquiera puede verificar si un documento ha sido certificado en blockchain. Introduce el hash del
            documento para confirmar su autenticidad y ver sus detalles de publicación.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-2">
            <form onSubmit={handleSearch} className="space-y-4">
              <label className="block text-sm font-medium text-foreground mb-2">Buscar por Hash del Documento</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ej: 0x8f26ca5f42b4c4a7fd4d8e9c1b7a3f5e2d6c9a1b"
                  className="flex-1 px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isSearching}
                />
                <Button type="submit" disabled={isSearching} className="px-6">
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Buscando
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verificar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes buscar usando el hash del documento (0x...) o el ID de la transacción blockchain
              </p>
            </form>
          </Card>

          {/* Results Section */}
          {searchPerformed && (
            <div className="mt-8 space-y-6">
              {verificationResult ? (
                <>
                  {/* Status Badge */}
                  <div>{renderVerificationBadge(verificationResult.status)}</div>

                  {/* Verification Details */}
                  {verificationResult.isVerified && (
                    <Card className="p-8 bg-accent/5 border border-accent/20">
                      <h2 className="text-2xl font-bold text-foreground mb-6">Detalles del Documento Verificado</h2>

                      <div className="space-y-6">
                        {/* Document Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Nombre del Documento</p>
                            <p className="font-semibold text-foreground text-lg">{verificationResult.documentName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Institución Emisora</p>
                            <p className="font-semibold text-foreground text-lg">{verificationResult.institution}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Fecha de Emisión</p>
                            <p className="font-semibold text-foreground text-lg">
                              {new Date(verificationResult.issueDate!).toLocaleDateString("es-CO")}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Fecha de Publicación Blockchain</p>
                            <p className="font-semibold text-foreground text-lg">
                              {new Date(verificationResult.publicationDate!).toLocaleDateString("es-CO")}
                            </p>
                          </div>
                        </div>

                        {/* Confidence Score */}
                        <div className="p-4 rounded-lg bg-background border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-foreground">Confianza de Verificación</p>
                            <p className="text-lg font-bold text-accent">{verificationResult.confidence}%</p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full transition-all"
                              style={{ width: `${verificationResult.confidence}%` }}
                            />
                          </div>
                        </div>

                        {/* Hashes */}
                        <div className="space-y-4 pt-4 border-t border-border">
                          <h3 className="font-semibold text-foreground">Información Blockchain</h3>

                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Hash del Documento</p>
                            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
                              <code className="text-xs text-muted-foreground flex-1 truncate">
                                {verificationResult.documentHash}
                              </code>
                              <button
                                onClick={() => handleCopy(verificationResult.documentHash!)}
                                className="p-2 hover:bg-muted rounded transition-colors"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4 text-accent" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>

                          {verificationResult.ipfsCid && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">CID de IPFS</p>
                              <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
                                <code className="text-xs text-muted-foreground flex-1 truncate">
                                  {verificationResult.ipfsCid}
                                </code>
                                {verificationResult.ipfsUrl && (
                                  <a
                                    href={verificationResult.ipfsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-muted rounded transition-colors"
                                    title="Ver archivo en IPFS"
                                  >
                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleCopy(verificationResult.ipfsCid!)}
                                  className="p-2 hover:bg-muted rounded transition-colors"
                                  title="Copiar CID"
                                >
                                  {copied ? (
                                    <Check className="w-4 h-4 text-accent" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {verificationResult.status === "pending" && (
                    <Card className="p-8 bg-warning/5 border border-warning/20">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Clock className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">Verificación en Proceso</h3>
                          <p className="text-muted-foreground mb-4">
                            Este documento ha sido enviado para verificación en blockchain. El proceso puede tomar entre
                            5 a 30 minutos según la congestión de la red.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Nombre del Documento:</strong> {verificationResult.documentName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Institución:</strong> {verificationResult.institution}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {verificationResult.status === "unverified" && (
                    <Card className="p-8 bg-destructive/5 border border-destructive/20">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <XCircle className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">Documento No Encontrado</h3>
                          <p className="text-muted-foreground">
                            No encontramos ningún documento con el hash proporcionado. Por favor verifica que hayas
                            ingresado el hash correcto y vuelve a intentar.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No se encontraron resultados. Intenta con otro hash.</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-6 bg-card/50 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Cómo Funciona la Verificación</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Obtén el Hash",
                description: "Accede al hash del documento desde la notificación o el certificado blockchain.",
              },
              {
                number: "2",
                title: "Ingresa el Hash",
                description: "Pega el hash en la barra de búsqueda de esta página de verificación pública.",
              },
              {
                number: "3",
                title: "Verifica",
                description: "El sistema busca el documento en blockchain y confirma su autenticidad instantáneamente.",
              },
            ].map((step, idx) => (
              <div key={idx} className="p-6 rounded-lg border border-border bg-background">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Info Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Seguridad y Transparencia</h2>
              <p className="text-muted-foreground">
                Cada documento verificable en Verifica es registrado en blockchain, garantizando:
              </p>
              <ul className="space-y-3">
                {[
                  "Inmutabilidad - Los documentos no pueden ser alterados",
                  "Trazabilidad - Registro completo de la publicación",
                  "Transparencia - Cualquiera puede verificar",
                  "Seguridad - Criptografía de nivel institucional",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="p-6 bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-4">Acerca de los Hashes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Un hash es una representación única de un documento. Si el contenido cambia aunque sea una letra, el
                hash será completamente diferente.
              </p>
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="text-xs font-mono text-muted-foreground">
                  Original: 0x8f26ca5f42b4c4a7fd4d8e9c1b7a3f5e2d6c9a1b
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Modificado: 0x2a5b8f1d4e7c9a3f5b2d8e1a6c4f9b3e7d1a5c8f
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Verifica. Transparencia institucional con blockchain.</p>
          <div className="flex gap-6 justify-center mt-4 text-xs">
            <a href="#" className="hover:text-primary transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
