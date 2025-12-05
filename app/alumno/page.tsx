"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, MoreVertical, Download, Eye, FileCheck, Clock, ExternalLink, Cloud } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useDocuments } from "@/hooks/use-documents"
import { useVerificaContract } from "@/hooks/use-verifica-contract"
import { hashToBytes32 } from "@/lib/contract-utils"
import { type DocumentData } from "@/lib/documents-storage"
import { toast } from "sonner"
import { formatAddress } from "@/lib/web3-utils"

export default function AlumnoPage() {
  const router = useRouter()
  const { authenticated, ready, getAccessToken } = usePrivy()
  const { role, canView, canRead, canSign, loading: roleLoading, ensName, displayName } = useRoles()
  const { walletAddress, loading: walletLoading } = useUserWallet()
  const { documents: apiDocuments, loading: documentsLoading, loadDocuments, signDocument: signDocAPI } = useDocuments()
  const { signDocument: signOnBlockchain, chainSupported } = useVerificaContract()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)
  const [signing, setSigning] = useState<string | null>(null)
  const hasShownWelcome = useRef(false)

  // Pre-cargar access token
  useEffect(() => {
    if (authenticated && ready) {
      getAccessToken().catch(() => {
        // Silently handle token fetch errors
      })
    }
  }, [authenticated, ready, getAccessToken])

  // Mostrar mensaje de bienvenida cuando se carga la página
  useEffect(() => {
    // Verificar si ya se mostró el mensaje en esta sesión
    if (!walletAddress) return
    
    const welcomeShownKey = `welcome_shown_${walletAddress}`
    const alreadyShown = typeof window !== "undefined" && localStorage.getItem(welcomeShownKey)

    if (
      ready &&
      authenticated &&
      !roleLoading &&
      !walletLoading &&
      !loading &&
      role === "alumno" &&
      walletAddress &&
      !alreadyShown &&
      !hasShownWelcome.current
    ) {
      hasShownWelcome.current = true
      if (typeof window !== "undefined") {
        localStorage.setItem(welcomeShownKey, "true")
      }
      
      // Usar ENS si está disponible, sino usar wallet address formateada
      const identifier = ensName || formatAddress(walletAddress)
      
      console.log("[Welcome] Mostrando mensaje de bienvenida para alumno:", { ensName, displayName, walletAddress, identifier })
      
      // Mostrar después de un pequeño delay para asegurar que la página está renderizada
      setTimeout(() => {
        toast.success(`Inicio de sesión con ${identifier}`, {
          description: `Bienvenido/a, ${displayName}`,
          duration: 4000,
        })
      }, 300)
    }
  }, [ready, authenticated, role, roleLoading, walletLoading, loading, ensName, displayName, walletAddress])

  // Cargar documentos asignados al alumno usando API
  useEffect(() => {
    if (ready && authenticated && walletAddress && role === "alumno" && !roleLoading) {
      setLoading(true)
      loadDocuments({ role: "alumno", memberAddress: walletAddress, targetRole: "alumnos" }).finally(() => {
        setLoading(false)
      })
    }
  }, [ready, authenticated, walletAddress, role, roleLoading, loadDocuments])

  // Actualizar documentos cuando cambien los de la API
  useEffect(() => {
    setDocuments([...apiDocuments].sort((a, b) => b.createdAt - a.createdAt))
  }, [apiDocuments])

  // Redirigir si no es alumno (SOLO cuando el rol esté completamente determinado y no sea alumno)
  useEffect(() => {
    // Esperar a que el rol se determine completamente antes de redirigir
    // No redirigir si está cargando o si el rol es "unknown" (puede ser temporal)
    if (
      ready &&
      authenticated &&
      !roleLoading &&
      !walletLoading &&
      role !== "alumno" &&
      role !== "unknown" &&
      !hasRedirected
    ) {
      setHasRedirected(true)
      toast.error("Esta página es solo para alumnos")
      router.replace("/documents") // Usar replace para evitar bucles
    }
  }, [ready, authenticated, role, roleLoading, walletLoading, hasRedirected, router])

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/")
    }
  }, [ready, authenticated, router])

  const handleView = (docId: string) => {
    router.push(`/alumno/${docId}`)
  }

  const handleDownload = async (doc: DocumentData) => {
    const firstFile = doc.files?.[0]
    const ipfsUrl = firstFile?.ipfsUrl
    
    if (ipfsUrl) {
      try {
        // Descargar desde IPFS
        const response = await fetch(ipfsUrl)
        if (!response.ok) throw new Error("Error descargando archivo")
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = firstFile.name || doc.title || "documento.pdf"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`Descargando ${doc.title}...`)
      } catch (error) {
        console.error("Error descargando:", error)
        toast.error("Error al descargar el archivo")
        // Fallback: abrir en nueva pestaña
        if (ipfsUrl) {
          window.open(ipfsUrl, "_blank")
        }
      }
    } else {
      toast.info("El archivo aún no está disponible en IPFS")
    }
  }

  const handleViewIPFS = (ipfsUrl?: string) => {
    if (ipfsUrl) {
      window.open(ipfsUrl, "_blank")
    } else {
      toast.info("El archivo aún no está disponible en IPFS")
    }
  }

  const handleSign = async (doc: DocumentData) => {
    if (!walletAddress) {
      toast.error("No hay wallet conectada")
      return
    }

    if (!canSign) {
      toast.error("No tienes permisos para firmar")
      return
    }

    // Verificar si ya firmó
    if (doc.signedBy?.includes(walletAddress.toLowerCase())) {
      toast.info("Ya has firmado este documento")
      return
    }

    setSigning(doc.id)
    try {
      let blockchainSigned = false
      
      // Paso 1: Firmar en blockchain si el documento está registrado y la chain está soportada
      if (chainSupported && doc.blockchainTxHash && doc.files?.[0]?.hash) {
        try {
          const documentHash = hashToBytes32(doc.files[0].hash)
          await signOnBlockchain(documentHash)
          blockchainSigned = true
          toast.success("Documento firmado en blockchain")
        } catch (blockchainError: any) {
          // Verificar si el usuario canceló la transacción
          const errorMessage = blockchainError?.message || String(blockchainError || "")
          const errorCode = blockchainError?.code || blockchainError?.error?.code
          
          // Códigos de error comunes cuando el usuario cancela:
          // 4001: User rejected the request (MetaMask)
          // "ACTION_REJECTED": WalletConnect
          // "user rejected": Mensaje común
          const isUserRejection = 
            errorCode === 4001 ||
            errorCode === "4001" ||
            errorMessage.toLowerCase().includes("user rejected") ||
            errorMessage.toLowerCase().includes("rejected") ||
            errorMessage.toLowerCase().includes("denied") ||
            errorMessage.toLowerCase().includes("cancelled") ||
            errorMessage.toLowerCase().includes("canceled")
          
          if (isUserRejection) {
            // Usuario canceló la transacción - NO continuar con firma en BD
            console.log("[Sign] Usuario canceló la firma en blockchain")
            toast.error("Firma cancelada. El documento no ha sido firmado.")
            return // Salir sin firmar en BD
          }
          
          // Otro tipo de error (red, contrato, etc.) - continuar con BD pero advertir
          console.warn("[Sign] Error firmando en blockchain (continuando con BD):", blockchainError)
          toast.warning("Error al firmar en blockchain, pero se intentará firmar en base de datos")
        }
      }

      // Paso 2: Siempre firmar en base de datos (obligatorio)
      // Solo si no fue cancelado por el usuario
      const success = await signDocAPI(doc.id, walletAddress)
      if (success) {
        toast.success(`Documento "${doc.title}" firmado exitosamente`)
        // Recargar documentos
        await loadDocuments({ role: "alumno", memberAddress: walletAddress, targetRole: "alumnos" })
      } else {
        toast.error("Error al firmar el documento")
      }
    } catch (error) {
      console.error("Error firmando documento:", error)
      toast.error("Error al firmar el documento")
    } finally {
      setSigning(null)
    }
  }

  // Mostrar loading mientras se carga autenticación, rol o wallet
  if (!ready || !authenticated || roleLoading || walletLoading || loading || documentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {roleLoading || walletLoading
              ? "Verificando rol..."
              : loading
                ? "Cargando documentos..."
                : "Verificando autenticación..."}
          </p>
        </div>
      </div>
    )
  }

  // Si el rol está determinado y no es alumno, mostrar loading mientras redirige
  if (role !== "alumno" && role !== "unknown") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Si el rol es unknown pero estamos esperando a que se cargue, mostrar loading
  if (role === "unknown" && (roleLoading || walletLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando rol...</p>
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
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Mis Documentos</h1>
              <p className="text-muted-foreground mt-1">
                Documentos enviados específicamente para ti como alumno
              </p>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {documents.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tienes documentos asignados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Los documentos aparecerán aquí cuando un maestro o el rector te los envíe
                  </p>
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id} className="p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{doc.title}</h3>
                            {doc.files?.[0]?.ipfsCid && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                                <Cloud className="w-3 h-3" />
                                IPFS
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {doc.institution} • {doc.category || "Sin categoría"} •{" "}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                          )}
                          {doc.files?.[0]?.ipfsUrl && (
                            <a
                              href={doc.files[0].ipfsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver en IPFS
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          {doc.status === "signed" && doc.signedBy?.includes(walletAddress?.toLowerCase() || "") ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Firmado por ti
                            </span>
                          ) : doc.status === "signed" ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Firmado
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canRead && (
                          <button
                            onClick={() => handleView(doc.id)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        {canRead && doc.files?.[0]?.ipfsUrl && (
                          <button
                            onClick={() => handleViewIPFS(doc.files?.[0]?.ipfsUrl)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Ver en IPFS"
                          >
                            <ExternalLink className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        {canRead && (
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Descargar"
                          >
                            <Download className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canRead && (
                              <DropdownMenuItem onClick={() => handleView(doc.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                            )}
                            {canRead && doc.files?.[0]?.ipfsUrl && (
                              <DropdownMenuItem onClick={() => handleViewIPFS(doc.files?.[0]?.ipfsUrl)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver en IPFS
                              </DropdownMenuItem>
                            )}
                            {canRead && (
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                              </DropdownMenuItem>
                            )}
                            {canSign && doc.status !== "signed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleSign(doc)}
                                  className="text-primary font-medium"
                                  disabled={signing === doc.id}
                                >
                                  <FileCheck className="w-4 h-4 mr-2" />
                                  {signing === doc.id ? "Firmando..." : "Firmar documento"}
                                </DropdownMenuItem>
                              </>
                            )}
                            {doc.status === "signed" && doc.signedBy?.includes(walletAddress?.toLowerCase() || "") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled className="text-green-600">
                                  <FileCheck className="w-4 h-4 mr-2" />
                                  Ya firmado por ti
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

