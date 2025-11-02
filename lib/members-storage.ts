/**
 * Almacenamiento de miembros del sistema
 * 
 * Guarda la lista de miembros agregados por el Rector en localStorage
 * Formato: { [walletAddress]: { ensName, role, addedBy, addedAt } }
 */

export interface MemberData {
  walletAddress: string
  ensName: string
  role: "alumno" | "maestro"
  addedBy: string // Wallet del rector que lo agregó
  addedAt: number // Timestamp
}

const STORAGE_KEY = "system_members"

/**
 * Obtiene todos los miembros del sistema
 */
export function getAllMembers(): Record<string, MemberData> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch (error) {
    console.error("[members-storage] Error al leer miembros:", error)
    return {}
  }
}

/**
 * Agrega un nuevo miembro
 */
export function addMember(member: MemberData): boolean {
  try {
    const members = getAllMembers()
    
    // Verificar que no exista ya
    if (members[member.walletAddress.toLowerCase()]) {
      return false // Ya existe
    }

    members[member.walletAddress.toLowerCase()] = member
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
    return true
  } catch (error) {
    console.error("[members-storage] Error al agregar miembro:", error)
    return false
  }
}

/**
 * Elimina un miembro
 */
export function removeMember(walletAddress: string): boolean {
  try {
    const members = getAllMembers()
    const normalized = walletAddress.toLowerCase()
    
    if (!members[normalized]) {
      return false // No existe
    }

    delete members[normalized]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
    return true
  } catch (error) {
    console.error("[members-storage] Error al eliminar miembro:", error)
    return false
  }
}

/**
 * Verifica si una wallet es miembro registrado
 */
export function isMember(walletAddress: string): boolean {
  const members = getAllMembers()
  return !!members[walletAddress.toLowerCase()]
}

/**
 * Obtiene información de un miembro específico
 */
export function getMember(walletAddress: string): MemberData | null {
  const members = getAllMembers()
  return members[walletAddress.toLowerCase()] || null
}

/**
 * Obtiene todos los miembros de un rol específico
 */
export function getMembersByRole(role: "alumno" | "maestro"): MemberData[] {
  const members = getAllMembers()
  return Object.values(members).filter((m) => m.role === role)
}

