"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { type DocumentData } from "@/lib/documents-storage"

/**
 * Hook para gestionar documentos usando las API routes
 */
export function useDocuments() {
  const { authenticated, getAccessToken } = usePrivy()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar documentos
   */
  const loadDocuments = useCallback(
    async (filters?: { role?: string; memberAddress?: string; targetRole?: string }) => {
      if (!authenticated) {
        setDocuments([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error("No se pudo obtener token de autenticación")
        }

        const params = new URLSearchParams()
        if (filters?.role) params.append("role", filters.role)
        if (filters?.memberAddress) params.append("memberAddress", filters.memberAddress)
        if (filters?.targetRole) params.append("targetRole", filters.targetRole)

        const response = await fetch(`/api/documents?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error cargando documentos")
        }

        const data = await response.json()
        setDocuments(data.documents || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error cargando documentos"
        setError(errorMessage)
        console.error("[useDocuments] Error:", err)
      } finally {
        setLoading(false)
      }
    },
    [authenticated, getAccessToken]
  )

  /**
   * Firmar documento
   */
  const signDocument = useCallback(
    async (documentId: string, signerAddress: string): Promise<boolean> => {
      if (!authenticated) return false

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) return false

        const response = await fetch(`/api/documents/${documentId}/sign`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ signerAddress }),
        })

        if (!response.ok) return false

        return true
      } catch (err) {
        console.error("[useDocuments] Error firmando:", err)
        return false
      }
    },
    [authenticated, getAccessToken]
  )

  /**
   * Eliminar documento
   */
  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      if (!authenticated) return false

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) return false

        const response = await fetch(`/api/documents?id=${documentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        return response.ok
      } catch (err) {
        console.error("[useDocuments] Error eliminando:", err)
        return false
      }
    },
    [authenticated, getAccessToken]
  )

  return {
    documents,
    loading,
    error,
    loadDocuments,
    signDocument,
    deleteDocument,
    refresh: loadDocuments,
  }
}

