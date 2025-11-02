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

