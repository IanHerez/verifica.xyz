/**
 * Sistema de asociación Email → ENS
 * 
 * Permite asociar un ENS a un email de usuario, en lugar de solo a una wallet.
 * Esto permite que usuarios compartan el mismo ENS o tengan ENS independientes
 * de su wallet específica.
 */

const STORAGE_KEY = "email_ens_mappings"

export interface EmailENSMapping {
  email: string
  ensName: string
  walletAddress?: string // Wallet asociada (opcional)
  createdAt: number
  updatedAt: number
}

/**
 * Obtiene todas las asociaciones email → ENS
 */
export function getEmailENSMappings(): EmailENSMapping[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as EmailENSMapping[]
  } catch (error) {
    console.error("Error leyendo mappings de email-ENS:", error)
    return []
  }
}

/**
 * Obtiene el ENS asociado a un email específico
 */
export function getENSByEmail(email: string): string | null {
  if (!email) return null

  const mappings = getEmailENSMappings()
  const mapping = mappings.find((m) => m.email.toLowerCase() === email.toLowerCase())
  return mapping?.ensName || null
}

/**
 * Asocia un ENS a un email
 */
export function setENSForEmail(
  email: string,
  ensName: string,
  walletAddress?: string
): void {
  if (!email || !ensName) return

  const mappings = getEmailENSMappings()
  const existingIndex = mappings.findIndex(
    (m) => m.email.toLowerCase() === email.toLowerCase()
  )

  const mapping: EmailENSMapping = {
    email: email.toLowerCase(),
    ensName: ensName.toLowerCase(),
    walletAddress,
    createdAt: existingIndex >= 0 ? mappings[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now(),
  }

  if (existingIndex >= 0) {
    mappings[existingIndex] = mapping
  } else {
    mappings.push(mapping)
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
  } catch (error) {
    console.error("Error guardando mapping email-ENS:", error)
  }
}

/**
 * Elimina la asociación ENS de un email
 */
export function removeENSForEmail(email: string): void {
  if (!email) return

  const mappings = getEmailENSMappings()
  const filtered = mappings.filter(
    (m) => m.email.toLowerCase() !== email.toLowerCase()
  )

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error("Error eliminando mapping email-ENS:", error)
  }
}

/**
 * Verifica si un ENS ya está asociado a otro email
 */
export function isENSAlreadyAssociated(ensName: string, currentEmail: string): boolean {
  const mappings = getEmailENSMappings()
  return mappings.some(
    (m) =>
      m.ensName.toLowerCase() === ensName.toLowerCase() &&
      m.email.toLowerCase() !== currentEmail.toLowerCase()
  )
}

