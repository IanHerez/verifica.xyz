/**
 * Configuración de Roles y Permisos del Sistema
 * 
 * Sistema de jerarquía basado en ENS:
 * - Alumno (menor jerarquía): ver, leer, firmar documentos enviados a alumnos
 * - Maestro: ver, leer, firmar documentos enviados a maestros, enviar documentos a alumnos
 * - Rector (mayor jerarquía): ver, leer, firmar documentos de todos, agregar miembros
 */

export type UserRole = "alumno" | "maestro" | "rector" | "unknown"

export interface RoleConfig {
  role: UserRole
  ensPattern: string // Patrón del ENS (ej: "rector.ian.eth")
  walletAddress: string
  displayName: string
  permissions: {
    canView: boolean
    canRead: boolean
    canSign: boolean
    canSendToAlumnos: boolean
    canSendToMaestros: boolean
    canManageMembers: boolean // Solo rector puede agregar miembros
  }
}

/**
 * Mapeo de wallets a roles (para verificación inicial/demo)
 */
export const WALLET_TO_ROLE_MAP: Record<string, RoleConfig> = {
  "0x06282f5f6930f1f0829fea710354e25f37de2aef": {
    role: "alumno",
    ensPattern: "alumno.clavely.eth",
    walletAddress: "0x06282f5F6930F1f0829feA710354E25f37DE2Aef",
    displayName: "Alumno Clavely",
    permissions: {
      canView: true,
      canRead: true,
      canSign: true,
      canSendToAlumnos: false,
      canSendToMaestros: false,
      canManageMembers: false,
    },
  },
  "0x9abdd265383573aec638601d77da43956385cb76": {
    role: "maestro",
    ensPattern: "maestro.elias.eth",
    walletAddress: "0x9AbDd265383573AEC638601d77da43956385cB76",
    displayName: "Maestro Elías",
    permissions: {
      canView: true,
      canRead: true,
      canSign: true,
      canSendToAlumnos: true,
      canSendToMaestros: false,
      canManageMembers: false,
    },
  },
  "0x5e8ce7675ecf8e892f704a4de8a268987789d0da": {
    role: "rector",
    ensPattern: "rector.ian.eth",
    walletAddress: "0x5E8CE7675ECF8e892f704A4de8A268987789d0Da",
    displayName: "Rector Ian",
    permissions: {
      canView: true,
      canRead: true,
      canSign: true,
      canSendToAlumnos: true,
      canSendToMaestros: true,
      canManageMembers: true,
    },
  },
}

/**
 * Determina el rol basado en el ENS
 * @param ensName - Nombre ENS (ej: "rector.ian.eth", "maestro.elias.eth")
 * @returns Rol del usuario o "unknown"
 */
export function getRoleFromENS(ensName: string | null | undefined): UserRole {
  if (!ensName) return "unknown"

  const normalized = ensName.toLowerCase().trim()

  // Verificar patrones específicos primero (para los casos de demo)
  if (normalized.includes("rector.")) return "rector"
  if (normalized.includes("maestro.")) return "maestro"
  if (normalized.includes("alumno.")) return "alumno"

  // Verificar patrones genéricos (para miembros agregados después)
  if (normalized.endsWith(".rector.eth")) return "rector"
  if (normalized.endsWith(".maestro.eth")) return "maestro"
  if (normalized.endsWith(".alumno.eth")) return "alumno"

  return "unknown"
}

/**
 * Obtiene la configuración de rol basada en wallet address
 * @param walletAddress - Dirección de la wallet
 * @returns Configuración de rol o null
 */
export function getRoleConfigByWallet(walletAddress: string | null | undefined): RoleConfig | null {
  if (!walletAddress) return null

  const normalized = walletAddress.toLowerCase().trim()
  return WALLET_TO_ROLE_MAP[normalized] || null
}

/**
 * Obtiene la configuración de rol basada en ENS
 * @param ensName - Nombre ENS
 * @param walletAddress - Dirección de la wallet (opcional, para verificación)
 * @returns Configuración de rol o permisos por defecto
 */
export function getRoleConfig(
  ensName: string | null | undefined,
  walletAddress?: string | null
): RoleConfig {
  // Primero intentar por wallet address (para casos de demo)
  if (walletAddress) {
    const walletConfig = getRoleConfigByWallet(walletAddress)
    if (walletConfig) return walletConfig
  }

  // Si no, determinar rol por ENS
  const role = getRoleFromENS(ensName)

  // Retornar configuración según el rol detectado
  switch (role) {
    case "rector":
      return {
        role: "rector",
        ensPattern: ensName || "*.rector.eth",
        walletAddress: walletAddress || "",
        displayName: "Rector",
        permissions: {
          canView: true,
          canRead: true,
          canSign: true,
          canSendToAlumnos: true,
          canSendToMaestros: true,
          canManageMembers: true,
        },
      }

    case "maestro":
      return {
        role: "maestro",
        ensPattern: ensName || "*.maestro.eth",
        walletAddress: walletAddress || "",
        displayName: "Maestro",
        permissions: {
          canView: true,
          canRead: true,
          canSign: true,
          canSendToAlumnos: true,
          canSendToMaestros: false,
          canManageMembers: false,
        },
      }

    case "alumno":
      return {
        role: "alumno",
        ensPattern: ensName || "*.alumno.eth",
        walletAddress: walletAddress || "",
        displayName: "Alumno",
        permissions: {
          canView: true,
          canRead: true,
          canSign: true,
          canSendToAlumnos: false,
          canSendToMaestros: false,
          canManageMembers: false,
        },
      }

    default:
      return {
        role: "unknown",
        ensPattern: ensName || "",
        walletAddress: walletAddress || "",
        displayName: "Usuario",
        permissions: {
          canView: false,
          canRead: false,
          canSign: false,
          canSendToAlumnos: false,
          canSendToMaestros: false,
          canManageMembers: false,
        },
      }
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(
  roleConfig: RoleConfig,
  permission: keyof RoleConfig["permissions"]
): boolean {
  return roleConfig.permissions[permission] ?? false
}

