"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy, getAccessToken } from "@privy-io/react-auth"

/**
 * Hook optimizado para manejar access tokens de Privy
 * 
 * Características:
 * - Pre-carga el token para reducir latencia
 * - Refresca automáticamente tokens expirados o próximos a expirar
 * - Maneja errores de token expirado con retry
 * - Cache del token para evitar requests innecesarios
 * 
 * Basado en: https://docs.privy.io/authentication/user-authentication/access-tokens
 */
export function usePrivyToken() {
  const { authenticated, ready } = usePrivy()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtiene el access token con refresh automático si es necesario
   * getAccessToken() automáticamente refresca tokens que están cerca de expirar o han expirado
   */
  const fetchToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!authenticated || !ready) {
      return null
    }

    // Si ya tenemos un token válido y no forzamos refresh, retornarlo
    if (token && !forceRefresh) {
      return token
    }

    setLoading(true)
    setError(null)

    try {
      // getAccessToken() automáticamente refresca si el token está próximo a expirar o ha expirado
      const accessToken = await getAccessToken()
      setToken(accessToken)
      setLoading(false)
      return accessToken
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener access token"
      setError(errorMessage)
      setLoading(false)

      // Si el error es "invalid auth token", intentar refrescar con backoff
      if (errorMessage.includes("invalid auth token") || errorMessage.includes("expired")) {
        console.warn("Token inválido o expirado, intentando refrescar...")
        
        // Retry con exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000))
        try {
          const refreshedToken = await getAccessToken()
          setToken(refreshedToken)
          setLoading(false)
          return refreshedToken
        } catch (retryErr) {
          console.error("Error al refrescar token:", retryErr)
          setError("No se pudo refrescar el token. Por favor, inicia sesión nuevamente.")
        }
      }

      return null
    }
  }, [authenticated, ready, token])

  /**
   * Pre-carga el token cuando el usuario está autenticado
   * Esto reduce la latencia en requests posteriores
   */
  useEffect(() => {
    if (authenticated && ready && !token) {
      fetchToken()
    }
  }, [authenticated, ready, token, fetchToken])

  /**
   * Refresca el token periódicamente si está próximo a expirar (cada 45 minutos)
   * Los tokens expiran después de 1 hora, así que refrescamos antes
   */
  useEffect(() => {
    if (!authenticated || !ready) {
      return
    }

    const refreshInterval = setInterval(() => {
      fetchToken(true) // Forzar refresh
    }, 45 * 60 * 1000) // 45 minutos

    return () => clearInterval(refreshInterval)
  }, [authenticated, ready, fetchToken])

  /**
   * Función para hacer requests autenticados con el token
   */
  const makeAuthenticatedRequest = useCallback(
    async (
      url: string,
      options: RequestInit = {}
    ): Promise<Response> => {
      const accessToken = await fetchToken()

      if (!accessToken) {
        throw new Error("No se pudo obtener access token")
      }

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
    },
    [fetchToken]
  )

  return {
    token,
    loading,
    error,
    fetchToken,
    makeAuthenticatedRequest,
    isAuthenticated: authenticated && ready,
  }
}

