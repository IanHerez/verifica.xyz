"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { FileText, MoreVertical, Download, Share2, Eye, Trash2, ExternalLink, Cloud } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { useDocuments } from "@/hooks/use-documents"
import { formatAddress } from "@/lib/web3-utils"

function DocumentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authenticated, ready, getAccessToken } = usePrivy()
  const { role, canView, canRead, canSign, displayName, loading: roleLoading, ensName } = useRoles()
  const { walletAddress, loading: walletLoading } = useUserWallet()
  const { documents: apiDocuments, loading: documentsLoading, loadDocuments, deleteDocument: deleteDocAPI } = useDocuments()
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const hasShownWelcome = useRef(false)

  // Pre-cargar access token cuando la página carga para reducir latencia
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
      role !== "unknown" &&
      role !== "alumno" &&
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
      
      console.log("[Welcome] Mostrando mensaje de bienvenida:", { ensName, displayName, role, walletAddress, identifier })
      
      // Mostrar después de un pequeño delay para asegurar que la página está renderizada
      setTimeout(() => {
        toast.success(`Inicio de sesión con ${identifier}`, {
          description: `Bienvenido/a, ${displayName}`,
          duration: 4000,
        })
      }, 300)
    }
  }, [ready, authenticated, role, roleLoading, walletLoading, loading, ensName, displayName, walletAddress])

  // Cargar documentos según el rol usando API
  useEffect(() => {
    if (ready && authenticated && !roleLoading && !walletLoading && walletAddress && role !== "unknown" && role !== "alumno") {
      setLoading(true)
      
      // Cargar documentos desde API
      const loadDocs = async () => {
        if (role === "maestro") {
          await loadDocuments({ targetRole: "maestros" })
        } else if (role === "rector") {
          await loadDocuments() // Todos los documentos
        }
      }
      
      loadDocs().finally(() => setLoading(false))
    }
  }, [ready, authenticated, walletAddress, role, roleLoading, walletLoading, loadDocuments])

  // Transformar documentos de API al formato esperado
  useEffect(() => {
    const loadedDocs = apiDocuments.map((doc) => ({
      id: doc.id,
      name: doc.title,
      type: doc.category || "PDF",
      date: doc.createdAt,
      size: doc.files.reduce((acc, f) => acc + f.size, 0),
      status: doc.status === "signed" ? "Verificado" : "Pendiente",
      documentData: doc,
    }))
    setDocuments(loadedDocs.sort((a, b) => b.date - a.date))
    setFilteredDocuments(loadedDocs.sort((a, b) => b.date - a.date))
  }, [apiDocuments])

  // Filtrar documentos según búsqueda
  useEffect(() => {
    const search = searchParams.get("search")
    if (search) {
      const filtered = documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(search.toLowerCase()) ||
          doc.type.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredDocuments(filtered)
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchParams, documents])

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/")
    }
  }, [ready, authenticated, router])

  const [hasRedirected, setHasRedirected] = useState(false)

  // Redirigir alumnos a su página especial
  useEffect(() => {
    if (ready && authenticated && !roleLoading && role === "alumno" && !hasRedirected) {
      setHasRedirected(true)
      router.replace("/alumno") // Usar replace para evitar bucles
    }
  }, [ready, authenticated, role, roleLoading, hasRedirected, router])

  // Verificar permisos (solo para roles que no sean alumno)
  useEffect(() => {
    if (ready && authenticated && !roleLoading && role !== "alumno" && role !== "unknown" && !canView) {
      toast.error("No tienes permisos para ver documentos")
      router.push("/")
    }
  }, [ready, authenticated, role, roleLoading, canView, router])

  const handleDownload = async (docId: string | number, docName: string, ipfsUrl?: string) => {
    if (ipfsUrl) {
      try {
        // Descargar desde IPFS
        const response = await fetch(ipfsUrl)
        if (!response.ok) throw new Error("Error descargando archivo")
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = docName || "documento.pdf"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`Descargando ${docName}...`)
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

  const handleShare = (docId: string | number, docName: string) => {
    if (navigator.share) {
      navigator
        .share({
          title: docName,
          text: `Compartir documento: ${docName}`,
          url: window.location.href,
        })
        .then(() => toast.success("Documento compartido"))
        .catch(() => toast.error("Error al compartir"))
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href)
      toast.success("Enlace copiado al portapapeles")
    }
  }

  const handleView = (docId: string | number) => {
    router.push(`/documents/${docId}`)
  }

  const handleDelete = async (docId: string | number, docName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${docName}"?`)) {
      const success = await deleteDocAPI(docId.toString())
      if (success) {
        toast.success(`Documento "${docName}" eliminado`)
        // Recargar documentos
        if (role === "maestro") {
          await loadDocuments({ targetRole: "maestros" })
        } else if (role === "rector") {
          await loadDocuments()
        }
      } else {
        toast.error("Error al eliminar el documento")
      }
    }
  }

  // Mostrar loading mientras verifica autenticación o rol
  if (!ready || !authenticated || roleLoading || walletLoading || loading || documentsLoading || role === "unknown") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loading ? "Cargando documentos..." : roleLoading || walletLoading ? "Verificando rol..." : "Verificando autenticación..."}
          </p>
        </div>
      </div>
    )
  }

  // Si es alumno, no renderizar nada (se redirigirá automáticamente)
  if (role === "alumno") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirigiendo...</p>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mis Documentos</h1>
                <p className="text-muted-foreground mt-1">
                  {role === "maestro"
                    ? "Documentos enviados a maestros"
                    : role === "rector"
                      ? "Todos los documentos del sistema"
                      : "Gestiona tus documentos certificados en blockchain"}
                </p>
              </div>
              {(role === "maestro" || role === "rector") && (
                <Link href="/create">
                  <Button>+ Nuevo Documento</Button>
                </Link>
              )}
            </div>

            {/* Document List */}
            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron documentos</p>
                </Card>
              ) : (
                filteredDocuments.map((doc) => (
                <Card key={doc.id} className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{doc.name}</h3>
                          {doc.documentData?.files?.[0]?.ipfsCid && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                              <Cloud className="w-3 h-3" />
                              IPFS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {typeof doc.size === "number" ? `${(doc.size / 1024).toFixed(1)} KB` : doc.size} •{" "}
                          {typeof doc.date === "number"
                            ? new Date(doc.date).toLocaleDateString()
                            : doc.date}
                        </p>
                        {doc.documentData?.files?.[0]?.ipfsUrl && (
                          <a
                            href={doc.documentData.files[0].ipfsUrl}
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
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doc.status === "Verificado"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.documentData?.files?.[0]?.ipfsUrl && (
                        <button
                          onClick={() => handleViewIPFS(doc.documentData?.files?.[0]?.ipfsUrl)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Ver en IPFS"
                        >
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc.id, doc.name, doc.documentData?.files?.[0]?.ipfsUrl)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-5 h-5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleShare(doc.id, doc.name)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Compartir"
                      >
                        <Share2 className="w-5 h-5 text-muted-foreground" />
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
                          {doc.documentData?.files?.[0]?.ipfsUrl && (
                            <DropdownMenuItem onClick={() => handleViewIPFS(doc.documentData?.files?.[0]?.ipfsUrl)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Ver en IPFS
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.name, doc.documentData?.files?.[0]?.ipfsUrl)}>
                            <Download className="w-4 h-4 mr-2" />
                            Descargar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(doc.id, doc.name)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(doc.id, doc.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
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

// Marcar como dinámica para evitar prerender
export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  )
}
