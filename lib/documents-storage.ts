/**
 * Almacenamiento de documentos y sus destinatarios
 * 
 * Guarda documentos con información de destinatarios en localStorage
 * Formato: { [documentId]: { documentData, sentTo: { role, memberAddress? } } }
 */

export interface DocumentData {
  id: string
  title: string
  description?: string
  institution: string
  issueDate?: string
  category?: string
  files: Array<{
    name: string
    size: number
    hash?: string
    ipfsCid?: string // CID de IPFS
    ipfsUrl?: string // URL del archivo en IPFS
  }>
  createdAt: number
  createdBy: string // Wallet del creador
  sentTo: {
    role: "alumnos" | "maestros"
    memberAddress?: string // Si es específico, si no es "todos"
  }
  status: "pending" | "signed" | "rejected"
  signedBy?: string[] // Array de wallets que han firmado
  blockchainTxHash?: string // Hash de transacción en blockchain (si se registró)
  blockchainChainId?: number // Chain ID donde se registró
}

const STORAGE_KEY = "documents"

/**
 * Obtiene todos los documentos
 */
export function getAllDocuments(): Record<string, DocumentData> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch (error) {
    console.error("[documents-storage] Error al leer documentos:", error)
    return {}
  }
}

/**
 * Guarda un documento
 */
export function saveDocument(document: DocumentData): void {
  try {
    const documents = getAllDocuments()
    documents[document.id] = document
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
  } catch (error) {
    console.error("[documents-storage] Error al guardar documento:", error)
  }
}

/**
 * Obtiene documentos para un rol específico
 * @param role - Rol del usuario ("alumno", "maestro") o rol de destinatario ("alumnos", "maestros")
 */
export function getDocumentsForRole(
  role: "alumno" | "maestro" | "alumnos" | "maestros"
): DocumentData[] {
  const documents = getAllDocuments()
  const documentsList = Object.values(documents)

  // Filtrar por rol de destinatario (convertir singular a plural si es necesario)
  const targetRole = role === "alumno" ? "alumnos" : role === "maestro" ? "maestros" : role

  return documentsList.filter((doc) => {
    // Documentos enviados a este rol (ya sea a todos o a miembros específicos)
    return doc.sentTo.role === targetRole
  })
}

/**
 * Obtiene documentos para un miembro específico
 * @param memberAddress - Wallet address del miembro
 * @param role - Rol del miembro
 */
export function getDocumentsForMember(
  memberAddress: string,
  role: "alumno" | "maestro"
): DocumentData[] {
  const documents = getAllDocuments()
  const documentsList = Object.values(documents)

  return documentsList.filter((doc) => {
    // Si el documento fue enviado a "todos" del rol, el miembro lo ve
    if (!doc.sentTo.memberAddress && doc.sentTo.role === (role === "alumno" ? "alumnos" : "maestros")) {
      return true
    }
    // Si el documento fue enviado específicamente a este miembro
    if (doc.sentTo.memberAddress?.toLowerCase() === memberAddress.toLowerCase()) {
      return true
    }
    return false
  })
}

/**
 * Firma un documento
 */
export function signDocument(documentId: string, signerAddress: string): boolean {
  try {
    const documents = getAllDocuments()
    const document = documents[documentId]

    if (!document) {
      return false
    }

    // Agregar firmante si no ha firmado ya
    if (!document.signedBy) {
      document.signedBy = []
    }

    if (!document.signedBy.includes(signerAddress.toLowerCase())) {
      document.signedBy.push(signerAddress.toLowerCase())
      document.status = "signed"
      documents[documentId] = document
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
    }

    return true
  } catch (error) {
    console.error("[documents-storage] Error al firmar documento:", error)
    return false
  }
}

/**
 * Elimina un documento
 */
export function deleteDocument(documentId: string): boolean {
  try {
    const documents = getAllDocuments()
    if (!documents[documentId]) {
      return false
    }

    delete documents[documentId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents))
    return true
  } catch (error) {
    console.error("[documents-storage] Error al eliminar documento:", error)
    return false
  }
}

