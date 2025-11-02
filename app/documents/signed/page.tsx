"use client"

import { useEffect, useState } from "react"
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
import { FileText, MoreVertical, Download, Eye, FileCheck, CheckCircle2, ExternalLink, Cloud } from "lucide-react"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useDocuments } from "@/hooks/use-documents"
import { type DocumentData } from "@/lib/documents-storage"
import { toast } from "sonner"

export default function SignedDocumentsPage() {
  const router = useRouter()
  const { authenticated, ready, getAccessToken } = usePrivy()
  const { role, loading: roleLoading } = useRoles()
  const { walletAddress, loading: walletLoading } = useUserWallet()
  const { documents: apiDocuments, loading: documentsLoading, loadDocuments } = useDocuments()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)

  // Pre-cargar access token
  useEffect(() => {
    if (authenticated && ready) {
      getAccessToken().catch(() => {
        // Silently handle token fetch errors
      })
    }
  }, [authenticated, ready, getAccessToken])

  // Cargar documentos firmados usando API
  useEffect(() => {
    const loadSignedDocs = async () => {
      if (ready && authenticated && !roleLoading && !walletLoading && walletAddress && role !== "unknown") {
        setLoading(true)
        
        if (role === "alumno") {
          await loadDocuments({ role: "alumno", memberAddress: walletAddress, targetRole: "alumnos" })
        } else if (role === "maestro") {
          await loadDocuments({ targetRole: "maestros" })
        } else if (role === "rector") {
          await loadDocuments()
        }
        
        setLoading(false)
      }
    }

    loadSignedDocs()
  }, [ready, authenticated, walletAddress, role, roleLoading, walletLoading, loadDocuments])

  // Filtrar documentos firmados por el usuario actual
  useEffect(() => {
    if (!walletAddress) {
      setDocuments([])
      return
    }

    let filtered = [...apiDocuments]

    if (role === "alumno" || role === "maestro") {
      // Filtrar solo los que este usuario haya firmado
      filtered = filtered.filter(
        (doc) => doc.status === "signed" && doc.signedBy?.includes(walletAddress.toLowerCase())
      )
    } else if (role === "rector") {
      // Rector: todos los documentos firmados (por cualquier usuario)
      filtered = filtered.filter((doc) => doc.status === "signed")
    }

    setDocuments(filtered.sort((a, b) => b.createdAt - a.createdAt))
  }, [apiDocuments, walletAddress, role])

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/")
    }
  }, [ready, authenticated, router])

  const handleView = (docId: string) => {
    if (role === "alumno") {
      router.push(`/alumno/${docId}`)
    } else {
      router.push(`/documents/${docId}`)
    }
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

  if (!ready || !authenticated || loading || roleLoading || walletLoading || documentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? "Cargando documentos firmados..." : "Verificando autenticación..."}
          </p>
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
              <h1 className="text-3xl font-bold text-foreground">Documentos Firmados</h1>
              <p className="text-muted-foreground mt-1">
                {role === "alumno"
                  ? "Documentos que has firmado como alumno"
                  : role === "maestro"
                    ? "Documentos que has firmado como maestro"
                    : "Todos los documentos firmados en el sistema"}
              </p>
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {documents.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay documentos firmados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role === "alumno"
                      ? "Los documentos que firmes aparecerán aquí"
                      : role === "maestro"
                        ? "Los documentos que firmes aparecerán aquí"
                        : "No hay documentos firmados en el sistema"}
                  </p>
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id} className="p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-green-500/10">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
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
                          {doc.signedBy && doc.signedBy.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Firmado por {doc.signedBy.length} {doc.signedBy.length === 1 ? "persona" : "personas"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Firmado
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(doc.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5 text-muted-foreground" />
                        </button>
                        {doc.files?.[0]?.ipfsUrl && (
                          <button
                            onClick={() => handleViewIPFS(doc.files?.[0]?.ipfsUrl)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Ver en IPFS"
                          >
                            <ExternalLink className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(doc.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            {doc.files?.[0]?.ipfsUrl && (
                              <DropdownMenuItem onClick={() => handleViewIPFS(doc.files?.[0]?.ipfsUrl)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver en IPFS
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </DropdownMenuItem>
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

