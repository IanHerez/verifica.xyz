"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Upload, FileCheck, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import { useState, useEffect } from "react"
import { hashFile, uploadToIPFS } from "@/lib/ipfs-utils"
import { useRoles } from "@/hooks/use-roles"
import { useUserWallet } from "@/hooks/use-user-wallet"
import { usePrivy } from "@privy-io/react-auth"
import { useVerificaContract } from "@/hooks/use-verifica-contract"
import { BrowserProvider } from "ethers"
import { getMembersByRole } from "@/lib/members-storage"
import { type DocumentData } from "@/lib/documents-storage"
import { toast } from "sonner"

interface DocumentFile {
  file: File // Archivo real
  name: string
  size: number
  hash?: string
  ipfsCid?: string
  ipfsUrl?: string
  uploadProgress?: number
}

interface PublishingState {
  status: "idle" | "uploading" | "hashing" | "publishing" | "success" | "error"
  message?: string
}

export default function CreateDocumentPage() {
  const { canSendToAlumnos, canSendToMaestros, role } = useRoles()
  const { walletAddress } = useUserWallet()
  const { getAccessToken, getEthereumProvider } = usePrivy()
  const { registerDocument: registerDocumentOnChain, chainSupported, chainId } = useVerificaContract()
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    institution: "",
    category: "",
    targetRole: "alumnos" as "alumnos" | "maestros",
    targetMember: "" as string,
  })
  const [publishingState, setPublishingState] = useState<PublishingState>({ status: "idle" })
  const [dragActive, setDragActive] = useState(false)
  const [availableAlumnos, setAvailableAlumnos] = useState<Array<{ walletAddress: string; ensName: string }>>([])
  const [availableMaestros, setAvailableMaestros] = useState<Array<{ walletAddress: string; ensName: string }>>([])

  // Cargar miembros disponibles según permisos
  useEffect(() => {
    if (canSendToAlumnos) {
      const alumnos = getMembersByRole("alumno")
      setAvailableAlumnos(alumnos.map((a) => ({ walletAddress: a.walletAddress, ensName: a.ensName })))
    }
    if (canSendToMaestros) {
      const maestros = getMembersByRole("maestro")
      setAvailableMaestros(maestros.map((m) => ({ walletAddress: m.walletAddress, ensName: m.ensName })))
    }
  }, [canSendToAlumnos, canSendToMaestros])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList: FileList) => {
    const newFiles: DocumentFile[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      // Only allow specific file types
      if (
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        newFiles.push({
          file,
          name: file.name,
          size: file.size,
        })
      }
    }
    setFiles([...files, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handlePublish = async () => {
    if (!files.length || !formData.title || !formData.institution || !walletAddress) {
      toast.error("Por favor completa todos los campos requeridos y conecta tu wallet")
      return
    }

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        toast.error("No se pudo obtener el token de autenticación")
        return
      }

      setPublishingState({ status: "hashing" })

      // Calcular hash real de cada archivo y subir a IPFS
      const processedFiles = await Promise.all(
        files.map(async (fileData) => {
          try {
            // Calcular hash real del archivo
            const hash = await hashFile(fileData.file)
            
            // Subir a IPFS
            setPublishingState({ status: "uploading" })
            const { ipfsHash, ipfsUrl } = await uploadToIPFS(fileData.file, accessToken)
            
            return {
              name: fileData.name,
              size: fileData.size,
              hash,
              ipfsCid: ipfsHash,
              ipfsUrl,
            }
          } catch (error) {
            console.error(`Error procesando archivo ${fileData.name}:`, error)
            throw error
          }
        })
      )

      setPublishingState({ status: "publishing" })

      // Registrar en blockchain si está disponible (opcional - no bloquea si falla)
      let blockchainTxHash: string | null = null
      let blockchainChainId: number | null = null
      
      console.log("[Create] Estado de blockchain:", {
        chainSupported,
        hasFiles: processedFiles.length > 0,
        firstFileHash: processedFiles[0]?.hash,
        firstFileIpfsCid: processedFiles[0]?.ipfsCid,
      })
      
      if (chainSupported && processedFiles.length > 0) {
        try {
          const firstFile = processedFiles[0]
          
          if (!firstFile.hash || !firstFile.ipfsCid) {
            throw new Error("Falta hash o IPFS CID del archivo")
          }
          
          // Construir array de destinatarios según el rol seleccionado
          let recipients: string[] = []
          
          // Si el valor es "__all__" o está vacío, significa "todos"
          const isAllSelected = !formData.targetMember || formData.targetMember === "__all__"
          
          if (!isAllSelected) {
            // Destinatario específico seleccionado
            recipients = [formData.targetMember]
          } else {
            // "Todos" del rol - obtener todos los miembros del rol
            if (formData.targetRole === "alumnos") {
              recipients = availableAlumnos.map(a => a.walletAddress).filter(addr => addr && addr.length > 0)
            } else if (formData.targetRole === "maestros") {
              recipients = availableMaestros.map(m => m.walletAddress).filter(addr => addr && addr.length > 0)
            }
          }

          // Validar que haya al menos un destinatario
          if (recipients.length === 0) {
            const roleName = formData.targetRole === "alumnos" ? "alumnos" : "maestros"
            const hasSpecificTarget = !!formData.targetMember
            const hasMembersInRole = formData.targetRole === "alumnos" 
              ? availableAlumnos.length > 0 
              : availableMaestros.length > 0
            
            let errorMessage = "No hay destinatarios disponibles."
            
            if (!hasSpecificTarget && !hasMembersInRole) {
              errorMessage = `No hay ${roleName} registrados. Por favor selecciona un destinatario específico o agrega miembros primero en la sección "Miembros".`
            } else if (!hasSpecificTarget && hasMembersInRole) {
              errorMessage = `Selecciona un destinatario específico de la lista o verifica que los ${roleName} tengan wallet address válida.`
            } else {
              errorMessage = "Selecciona un destinatario válido."
            }
            
            throw new Error(errorMessage)
          }

          // Calcular issuedAt como Unix timestamp (segundos)
          const issueDate = new Date().toISOString().split("T")[0] // Fecha actual
          const issuedAt = Math.floor(new Date(issueDate).getTime() / 1000) // Convertir a Unix timestamp
          
          console.log("[Create] Intentando registrar en blockchain:", {
            hash: firstFile.hash,
            ipfsCid: firstFile.ipfsCid,
            title: formData.title,
            institution: formData.institution,
            recipients,
            recipientsCount: recipients.length,
            issuedAt,
          })
          
          const result = await registerDocumentOnChain(
            firstFile.hash,
            firstFile.ipfsCid || "",
            formData.title,
            formData.institution,
            recipients, // NUEVO: Pasar destinatarios
            issuedAt // Pasar timestamp explícitamente
          )
          
          // Si el documento ya existía, no hay txHash nuevo pero es exitoso
          if (result.alreadyExists) {
            console.log("[Create] ⚠️ Documento ya existe en blockchain:", {
              message: result.message,
            })
            toast.info(result.message || "El documento ya está registrado en blockchain")
            // No actualizar blockchainTxHash ni blockchainChainId ya que no hubo nueva transacción
          } else {
            blockchainTxHash = result.txHash || undefined
            
            // Obtener chainId actual del provider o del hook
            if (chainId) {
              blockchainChainId = chainId
            } else {
              // Fallback: obtener del provider directamente
              try {
                const provider = await getEthereumProvider()
                if (provider) {
                  const ethersProvider = new BrowserProvider(provider)
                  const network = await ethersProvider.getNetwork()
                  blockchainChainId = Number(network.chainId)
                }
              } catch (providerError) {
                console.warn("[Create] Error obteniendo chainId del provider:", providerError)
              }
            }
            
            console.log("[Create] ✅ Documento registrado en blockchain:", {
              txHash: blockchainTxHash,
              chainId: blockchainChainId,
            })
            
            if (blockchainTxHash) {
              toast.success(`Documento registrado en blockchain: ${blockchainTxHash.slice(0, 10)}...`)
            }
          }
        } catch (blockchainError: any) {
          // No bloquear el flujo si falla blockchain, pero mostrar el error
          const errorMessage = blockchainError?.message || blockchainError?.toString() || "Error desconocido"
          console.error("[Create] ❌ Error registrando en blockchain:", blockchainError)
          console.error("[Create] Detalles del error:", {
            message: errorMessage,
            code: blockchainError?.code,
            reason: blockchainError?.reason,
            data: blockchainError?.data,
          })
          
          // Mostrar error específico al usuario
          if (errorMessage.includes("Not authorized") || errorMessage.includes("not authorized")) {
            toast.error("Tu wallet no está autorizada. Autoriza tu dirección usando authorizeCreator en Remix")
          } else if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
            toast.error("Transacción rechazada. El documento se guardó sin blockchain")
          } else {
            toast.warning(`Error en blockchain: ${errorMessage.slice(0, 50)}... El documento se guardó igual`)
          }
        }
      } else {
        if (!chainSupported) {
          console.warn("[Create] ⚠️ Blockchain no soportada - verificando estado del contrato")
          toast.info("Blockchain no disponible. El documento se guardó sin registro en blockchain")
        }
      }

      // Crear documento usando API
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          institution: formData.institution,
          issueDate: new Date().toISOString().split("T")[0], // Timestamp actual como fecha de emisión
          category: formData.category,
          files: processedFiles,
          createdBy: walletAddress,
          sentTo: {
            role: formData.targetRole,
            memberAddress: formData.targetMember || undefined,
          },
          blockchainTxHash, // Incluir hash de transacción si se registró en blockchain
          blockchainChainId, // Chain ID donde se registró
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar documento")
      }

      setPublishingState({
        status: "success",
        message: `${formData.title} ha sido publicado exitosamente`,
      })

      toast.success("Documento publicado exitosamente")

      // Reset form after success
      setTimeout(() => {
        setFiles([])
        setFormData({
          title: "",
          description: "",
          institution: "",
          category: "",
          targetRole: "alumnos",
          targetMember: "",
        })
        setPublishingState({ status: "idle" })
      }, 3000)
    } catch (error) {
      console.error("Error publicando documento:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al publicar el documento"
      setPublishingState({
        status: "error",
        message: errorMessage,
      })
      toast.error(errorMessage)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Crear Documento</h1>
              <p className="text-muted-foreground mt-1">Carga y certifica tus documentos en blockchain</p>
            </div>

            {/* Success Message */}
            {publishingState.status === "success" && (
              <Card className="p-4 mb-8 bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="font-medium text-accent">{publishingState.message}</p>
                    <p className="text-sm text-muted-foreground">Se redireccionará al dashboard en unos momentos</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {publishingState.status === "error" && (
              <Card className="p-4 mb-8 bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="font-medium text-destructive">{publishingState.message}</p>
                </div>
              </Card>
            )}

            {/* Upload Section */}
            <input
              type="file"
              id="file-input"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
              disabled={publishingState.status !== "idle"}
            />
            <Card
              className={`p-8 border-2 border-dashed transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              } ${publishingState.status !== "idle" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={(e) => {
                if (publishingState.status === "idle" && !dragActive) {
                  e.preventDefault()
                  document.getElementById("file-input")?.click()
                }
              }}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Sube tus documentos</h3>
                <p className="text-muted-foreground mb-6">
                  Arrastra archivos aquí o haz clic para seleccionar. Soportamos PDF, DOC, DOCX
                </p>
                <Button 
                  variant="outline" 
                  disabled={publishingState.status !== "idle"}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (publishingState.status === "idle") {
                      document.getElementById("file-input")?.click()
                    }
                  }}
                >
                  Seleccionar Archivos
                </Button>
              </div>
            </Card>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <Card className="p-6 mt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Archivos Cargados</h3>
                <div className="space-y-3">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileCheck className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        {file.hash && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">Verificado</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        disabled={publishingState.status !== "idle"}
                        className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Document Details */}
            <Card className="p-6 mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">Detalles del Documento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Título del Documento <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ej: Certificado de Graduación"
                    disabled={publishingState.status !== "idle"}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Descripción</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe el contenido del documento..."
                    disabled={publishingState.status !== "idle"}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Institución <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      placeholder="Universidad o Institución"
                      disabled={publishingState.status !== "idle"}
                      className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={publishingState.status !== "idle"}
                      className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="">Seleccionar categoría...</option>
                      <option value="academic">Académico</option>
                      <option value="professional">Profesional</option>
                      <option value="government">Gubernamental</option>
                      <option value="legal">Legal</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Destinatarios (solo si tiene permisos para enviar) */}
                {(canSendToAlumnos || canSendToMaestros) && (
                  <>
                    <div className="pt-4 border-t border-border">
                      <Label className="text-sm font-medium text-foreground mb-4 block">
                        Enviar documento a
                      </Label>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="target-role" className="text-xs text-muted-foreground mb-2 block">
                            Tipo de destinatario
                          </Label>
                          <Select
                            value={formData.targetRole}
                            onValueChange={(value: "alumnos" | "maestros") =>
                              setFormData((prev) => ({ ...prev, targetRole: value, targetMember: "" }))
                            }
                            disabled={publishingState.status !== "idle"}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {canSendToAlumnos && <SelectItem value="alumnos">Alumnos</SelectItem>}
                              {canSendToMaestros && <SelectItem value="maestros">Maestros</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.targetRole === "alumnos" && availableAlumnos.length > 0 && (
                          <div>
                            <Label htmlFor="target-member" className="text-xs text-muted-foreground mb-2 block">
                              Seleccionar alumno (opcional - dejar vacío para todos)
                            </Label>
                            <Select
                              value={formData.targetMember}
                              onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, targetMember: value }))
                              }
                              disabled={publishingState.status !== "idle"}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todos los alumnos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__all__">Todos los alumnos</SelectItem>
                                {availableAlumnos.map((alumno) => (
                                  <SelectItem key={alumno.walletAddress} value={alumno.walletAddress}>
                                    {alumno.ensName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {formData.targetRole === "maestros" && availableMaestros.length > 0 && (
                          <div>
                            <Label htmlFor="target-member" className="text-xs text-muted-foreground mb-2 block">
                              Seleccionar maestro (opcional - dejar vacío para todos)
                            </Label>
                            <Select
                              value={formData.targetMember}
                              onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, targetMember: value }))
                              }
                              disabled={publishingState.status !== "idle"}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Todos los maestros" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__all__">Todos los maestros</SelectItem>
                                {availableMaestros.map((maestro) => (
                                  <SelectItem key={maestro.walletAddress} value={maestro.walletAddress}>
                                    {maestro.ensName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Publishing Status */}
            {(publishingState.status === "hashing" || publishingState.status === "publishing") && (
              <Card className="p-6 mt-8 bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="font-medium text-foreground">
                      {publishingState.status === "hashing"
                        ? "Verificando documentos..."
                        : "Publicando en blockchain..."}
                    </p>
                    <p className="text-sm text-muted-foreground">Por favor no cierres esta página</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={publishingState.status !== "idle"}
                onClick={() => {
                  setFiles([])
                  setFormData({
                    title: "",
                    description: "",
                    institution: "",
                    category: "",
                    targetRole: "alumnos",
                    targetMember: "",
                  })
                }}
              >
                Limpiar
              </Button>
              <Button
                className="flex-1"
                disabled={
                  !files.length || !formData.title || !formData.institution || publishingState.status !== "idle"
                }
                onClick={handlePublish}
              >
                {publishingState.status === "idle" ? "Certificar en Blockchain" : "Procesando..."}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
