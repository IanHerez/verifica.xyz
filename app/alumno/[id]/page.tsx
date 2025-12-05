"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useDocuments } from "@/hooks/use-documents"
import { useVerificaContract } from "@/hooks/use-verifica-contract"
import { hashToBytes32 } from "@/lib/contract-utils"
import { toast } from "sonner"
import { FileText, Download, FileCheck, ArrowLeft, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function AlumnoDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const { authenticated, ready, getAccessToken } = usePrivy()
  const { role, canRead, canSign } = useRoles()
  const { walletAddress } = useUserWallet()
  const { signDocument: signDocAPI } = useDocuments()
  const { signDocument: signOnBlockchain, chainSupported } = useVerificaContract()
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      if (ready && authenticated && walletAddress && documentId && role === "alumno") {
        try {
          const accessToken = await getAccessToken()
          if (!accessToken) {
            throw new Error("No se pudo obtener token")
          }

          const response = await fetch(`/api/documents/${documentId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (!response.ok) {
            throw new Error("Documento no encontrado")
          }

          const data = await response.json()
          const doc = data.document

          // Verificar que el documento es para este alumno
          if (
            doc.sentTo.role === "alumnos" &&
            (!doc.sentTo.memberAddress || doc.sentTo.memberAddress.toLowerCase() === walletAddress.toLowerCase())
          ) {
            setDocument(doc)
          } else {
            throw new Error("Documento no encontrado")
          }
        } catch (error) {
          console.error("Error cargando documento:", error)
          toast.error("Documento no encontrado")
          router.push("/alumno")
        } finally {
          setLoading(false)
        }
      }
    }

    loadDocument()
  }, [ready, authenticated, walletAddress, documentId, role, router, getAccessToken])

  useEffect(() => {
    if (ready && authenticated && role !== "alumno") {
      router.push("/documents")
    }
  }, [ready, authenticated, role, router])

  const handleSign = async () => {
    if (!walletAddress || !document) return

    if (!canSign) {
      toast.error("No tienes permisos para firmar")
      return
    }

    if (document.signedBy?.includes(walletAddress.toLowerCase())) {
      toast.info("Ya has firmado este documento")
      return
    }

    setSigning(true)
    try {
      let blockchainSigned = false
      
      // Paso 1: Firmar en blockchain si el documento está registrado y la chain está soportada
      if (chainSupported && document.blockchainTxHash && document.files?.[0]?.hash) {
        try {
          const documentHash = hashToBytes32(document.files[0].hash)
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
      const success = await signDocAPI(document.id, walletAddress)
      if (success) {
        toast.success("Documento firmado exitosamente")
        // Recargar documento
        const accessToken = await getAccessToken()
        if (accessToken) {
          const response = await fetch(`/api/documents/${document.id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            setDocument(data.document)
          }
        }
      } else {
        toast.error("Error al firmar el documento")
      }
    } catch (error) {
      console.error("Error firmando documento:", error)
      toast.error("Error al firmar el documento")
    } finally {
      setSigning(false)
    }
  }

  if (!ready || !authenticated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  const isSigned = document.signedBy?.includes(walletAddress?.toLowerCase() || "") || false

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link href="/alumno">
              <Button variant="outline" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a mis documentos
              </Button>
            </Link>

            {/* Document Header */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{document.title}</h1>
                    <p className="text-muted-foreground mt-1">{document.institution}</p>
                  </div>
                </div>
                <div>
                  {isSigned ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Firmado por ti
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pendiente de firma
                    </span>
                  )}
                </div>
              </div>

              {document.description && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                  <p className="text-foreground">{document.description}</p>
                </div>
              )}
            </Card>

            {/* Document Details */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Información del Documento</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categoría</p>
                  <p className="font-medium text-foreground">{document.category || "Sin categoría"}</p>
                </div>
                {document.issueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de Emisión</p>
                    <p className="font-medium text-foreground">{new Date(document.issueDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de Creación</p>
                  <p className="font-medium text-foreground">{new Date(document.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <p className="font-medium text-foreground capitalize">{document.status}</p>
                </div>
              </div>
            </Card>

            {/* Files */}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Archivos</h2>
              <div className="space-y-3">
                {document.files.map((file: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.hash ? `Hash: ${file.hash.slice(0, 16)}...` : "Sin hash"}
                        </p>
                      </div>
                    </div>
                    {canRead && (
                      <Button variant="outline" size="sm" onClick={() => toast.info("Descarga próximamente")}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Sign Action */}
            {canSign && !isSigned && (
              <Card className="p-6 bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Firmar Documento</h3>
                    <p className="text-sm text-muted-foreground">
                      Al firmar, confirmas que has revisado y aceptas el contenido de este documento
                    </p>
                  </div>
                  <Button onClick={handleSign} className="ml-4" disabled={signing}>
                    <FileCheck className="w-4 h-4 mr-2" />
                    {signing ? "Firmando..." : "Firmar Ahora"}
                  </Button>
                </div>
              </Card>
            )}

            {isSigned && (
              <Card className="p-6 bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-foreground">Documento Firmado</h3>
                    <p className="text-sm text-muted-foreground">
                      Has firmado este documento. La firma queda registrada en blockchain.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

