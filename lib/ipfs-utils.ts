/**
 * Utilidades para IPFS
 * 
 * Funciones helper para trabajar con IPFS y hash de archivos
 */

/**
 * Calcula el hash SHA-256 de un archivo
 * @param file - Archivo File o Blob
 * @returns Hash hexadecimal con prefijo 0x
 */
export async function hashFile(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `0x${hashHex}`
}

/**
 * Sube un archivo a IPFS usando la API
 * @param file - Archivo a subir
 * @param accessToken - Token de Privy para autenticación
 * @returns CID de IPFS y URL del gateway
 */
export async function uploadToIPFS(
  file: File,
  accessToken: string
): Promise<{ ipfsHash: string; ipfsUrl: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/ipfs/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Error subiendo archivo a IPFS")
  }

  const result = await response.json()
  return {
    ipfsHash: result.ipfsHash,
    ipfsUrl: result.ipfsUrl,
  }
}

/**
 * Obtiene la URL de un archivo en IPFS
 * @param ipfsHash - CID de IPFS
 * @param gateway - Gateway IPFS (default: Pinata)
 * @returns URL completa del archivo
 */
export function getIPFSUrl(ipfsHash: string, gateway: string = "https://gateway.pinata.cloud/ipfs/"): string {
  return `${gateway}${ipfsHash}`
}

/**
 * Descarga un archivo desde IPFS usando su CID
 * @param ipfsHash - CID de IPFS
 * @param gateway - Gateway IPFS (default: Pinata)
 * @returns Blob del archivo
 */
export async function downloadFromIPFS(
  ipfsHash: string,
  gateway: string = "https://gateway.pinata.cloud/ipfs/"
): Promise<Blob> {
  const url = getIPFSUrl(ipfsHash, gateway)
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Error descargando archivo desde IPFS: ${response.statusText}`)
  }
  
  return await response.blob()
}

/**
 * Verifica si un CID de IPFS es válido y accesible
 * @param ipfsHash - CID de IPFS a verificar
 * @param gateway - Gateway IPFS (default: Pinata)
 * @returns true si el archivo es accesible
 */
export async function verifyIPFSCid(
  ipfsHash: string,
  gateway: string = "https://gateway.pinata.cloud/ipfs/"
): Promise<boolean> {
  try {
    const url = getIPFSUrl(ipfsHash, gateway)
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Obtiene información de un archivo en IPFS
 * @param ipfsHash - CID de IPFS
 * @param gateway - Gateway IPFS (default: Pinata)
 * @returns Información del archivo (tamaño, tipo, etc.)
 */
export async function getIPFSFileInfo(
  ipfsHash: string,
  gateway: string = "https://gateway.pinata.cloud/ipfs/"
): Promise<{ size: number; type: string; url: string }> {
  const url = getIPFSUrl(ipfsHash, gateway)
  const response = await fetch(url, { method: "HEAD" })
  
  if (!response.ok) {
    throw new Error(`Archivo no encontrado en IPFS: ${response.statusText}`)
  }
  
  return {
    size: parseInt(response.headers.get("content-length") || "0", 10),
    type: response.headers.get("content-type") || "application/octet-stream",
    url,
  }
}

