/**
 * Utilidades para interactuar con el contrato VerificaDocuments
 * 
 * Funciones helper para verificar chain, obtener contrato, etc.
 */

import { BrowserProvider, Contract, JsonRpcSigner } from "ethers"
import { getChainConfig, getContractAddress, isSupportedChain } from "./contract-config"

// ABI del contrato VerificaDocuments
export const VERIFICA_DOCUMENTS_ABI = [
  // registerDocument (actualizado con recipients)
  "function registerDocument(bytes32 _documentHash, string memory _ipfsCid, string memory _title, string memory _institution, address[] memory _recipients, uint256 _issuedAt) public returns (bool)",
  
  // signDocument
  "function signDocument(bytes32 _documentHash) public returns (bool)",
  
  // verifyDocument
  "function verifyDocument(bytes32 _documentHash) public view returns (bool, tuple(bytes32 documentHash, string ipfsCid, address creator, string title, string institution, uint256 createdAt, uint256 issuedAt, bool verified, bool revoked, address[] signers))",
  
  // revokeDocument
  "function revokeDocument(bytes32 _documentHash) public returns (bool)",
  
  // getUserDocuments
  "function getUserDocuments(address _user) public view returns (bytes32[])",
  
  // getDocumentSigners
  "function getDocumentSigners(bytes32 _documentHash) public view returns (tuple(address signer, uint256 signedAt)[])",
  
  // getTotalDocuments
  "function getTotalDocuments() public view returns (uint256)",
  
  // getDocumentIpfsCid (NUEVO)
  "function getDocumentIpfsCid(bytes32 _documentHash) public view returns (string memory)",
  
  // canSignDocument (NUEVO)
  "function canSignDocument(bytes32 _documentHash, address _signer) public view returns (bool)",
  
  // getDocumentRecipients (NUEVO)
  "function getDocumentRecipients(bytes32 _documentHash) public view returns (address[] memory)",
  
  // authorizeCreator
  "function authorizeCreator(address _creator) public",
  
  // revokeCreator
  "function revokeCreator(address _creator) public",
  
  // MAX_RECIPIENTS (NUEVO)
  "function MAX_RECIPIENTS() public view returns (uint256)",
  
  // Events
  "event DocumentRegistered(bytes32 indexed documentHash, address indexed creator, string title, string institution, address[] recipients, uint256 createdAt)",
  "event DocumentSigned(bytes32 indexed documentHash, address indexed signer, uint256 signedAt)",
  "event DocumentRevoked(bytes32 indexed documentHash, address indexed revokedBy, uint256 revokedAt)",
  
  // View functions
  "function documents(bytes32) public view returns (bytes32 documentHash, string memory ipfsCid, address creator, string memory title, string memory institution, address[] memory recipients, uint256 createdAt, uint256 issuedAt, bool verified, bool revoked)",
] as const

/**
 * Obtiene el contrato VerificaDocuments para la chain actual
 */
export async function getVerificaContract(
  provider: BrowserProvider,
  signer?: JsonRpcSigner
): Promise<Contract | null> {
  try {
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)
    
    if (!isSupportedChain(chainId)) {
      console.error(`[contract-utils] Chain ${chainId} no soportada`)
      return null
    }
    
    const contractAddress = getContractAddress(chainId)
    if (!contractAddress) {
      console.error(`[contract-utils] No hay dirección de contrato para chain ${chainId}`)
      return null
    }
    
    const contractSigner = signer || (await provider.getSigner())
    const contract = new Contract(contractAddress, VERIFICA_DOCUMENTS_ABI, contractSigner)
    
    console.log(`[contract-utils] Contrato obtenido para ${chainId}: ${contractAddress}`)
    return contract
  } catch (error) {
    console.error("[contract-utils] Error obteniendo contrato:", error)
    return null
  }
}

/**
 * Convierte hash string a bytes32
 */
export function hashToBytes32(hash: string): string {
  // Si ya tiene 0x y es de 66 caracteres, ya es bytes32
  if (hash.startsWith("0x") && hash.length === 66) {
    return hash
  }
  
  // Si tiene 0x pero es más largo, tomar los primeros 32 bytes
  if (hash.startsWith("0x") && hash.length > 66) {
    return hash.slice(0, 66) as `0x${string}`
  }
  
  // Si no tiene 0x, agregarlo y ajustar longitud
  const cleanHash = hash.replace(/^0x/, "")
  if (cleanHash.length > 64) {
    return `0x${cleanHash.slice(0, 64)}` as `0x${string}`
  }
  
  return `0x${cleanHash.padStart(64, "0")}` as `0x${string}`
}

/**
 * Verifica si estamos en una chain soportada
 */
export async function checkSupportedChain(
  provider: BrowserProvider
): Promise<{ supported: boolean; chainId?: number; chainName?: string }> {
  try {
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)
    const config = getChainConfig(chainId)
    
    if (!config) {
      return { supported: false, chainId }
    }
    
    return {
      supported: true,
      chainId,
      chainName: config.name,
    }
  } catch (error) {
    console.error("[contract-utils] Error verificando chain:", error)
    return { supported: false }
  }
}

