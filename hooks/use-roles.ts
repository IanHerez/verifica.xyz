"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useUserWallet } from "./use-user-wallet"
import { useEmailENS } from "./use-email-ens"
import { getRoleConfig, type UserRole, type RoleConfig } from "@/lib/roles-config"

/**
 * Hook para obtener el rol y permisos del usuario actual
 * 
 * Determina el rol basado en:
 * 1. ENS asociado al email del usuario
 * 2. ENS de la wallet (fallback)
 * 3. Wallet address directa (para casos de demo)
 */
export function useRoles() {
  const { authenticated, ready, user } = usePrivy()
  const { walletAddress, loading: walletLoading } = useUserWallet()
  const { ensName: finalENS } = useEmailENS()

  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRole = useCallback(() => {
    if (!authenticated || !ready) {
      setRoleConfig(null)
      setLoading(false)
      return
    }

    // Si la wallet aún se está cargando, mantener loading y esperar
    // Esto evita determinar el rol como "unknown" antes de que la wallet esté disponible
    if (walletLoading && !walletAddress) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener configuración de rol basada en ENS y wallet
      // La función getRoleConfig maneja el caso cuando walletAddress es undefined
      const config = getRoleConfig(finalENS, walletAddress || undefined)
      setRoleConfig(config)
      
      // Rol determinado exitosamente
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al determinar rol"
      setError(errorMessage)
      console.error("[useRoles] Error:", err)
    } finally {
      setLoading(false)
    }
  }, [authenticated, ready, finalENS, walletAddress, walletLoading])

  useEffect(() => {
    refreshRole()
  }, [refreshRole])

  // Helpers para verificar permisos específicos
  const canView = roleConfig ? roleConfig.permissions.canView : false
  const canRead = roleConfig ? roleConfig.permissions.canRead : false
  const canSign = roleConfig ? roleConfig.permissions.canSign : false
  const canSendToAlumnos = roleConfig ? roleConfig.permissions.canSendToAlumnos : false
  const canSendToMaestros = roleConfig ? roleConfig.permissions.canSendToMaestros : false
  const canManageMembers = roleConfig ? roleConfig.permissions.canManageMembers : false

  return {
    role: roleConfig?.role || "unknown",
    roleConfig,
    loading: loading || walletLoading, // Incluir walletLoading en el estado de loading
    error,
    refreshRole,
    // Permisos directos
    canView,
    canRead,
    canSign,
    canSendToAlumnos,
    canSendToMaestros,
    canManageMembers,
    // Info adicional
    isAuthenticated: authenticated && ready,
    ensName: finalENS,
    walletAddress,
    displayName: roleConfig?.displayName || "Usuario",
  }
}

