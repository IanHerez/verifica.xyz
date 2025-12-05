"use client"

import { useState, useEffect, useCallback } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { BrowserProvider, JsonRpcSigner, Contract } from "ethers"
import { getVerificaContract, hashToBytes32, checkSupportedChain, VERIFICA_DOCUMENTS_ABI } from "@/lib/contract-utils"
import { getChainConfig, getContractAddress } from "@/lib/contract-config"
import { toast } from "sonner"

/**
 * Hook para interactuar con el contrato VerificaDocuments
 */
export function useVerificaContract() {
  const { authenticated, ready, getEthereumProvider } = usePrivy()
  const [contract, setContract] = useState<Contract | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [chainSupported, setChainSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar contrato cuando el usuario está autenticado
   */
  useEffect(() => {
    if (!authenticated || !ready) {
      setContract(null)
      setChainId(null)
      setChainSupported(false)
      return
    }

    const loadContract = async () => {
      setLoading(true)
      setError(null)

      try {
        // Obtener provider desde Privy (soporta wallets externas y embebidas)
        let provider = null
        
        try {
          // Intentar obtener provider de Privy primero
          if (getEthereumProvider) {
            provider = await getEthereumProvider()
          }
        } catch (privyError) {
          // Si falla Privy, intentar window.ethereum como fallback
          console.warn("[useVerificaContract] Error obteniendo provider de Privy, usando fallback:", privyError)
        }
        
        // Fallback: usar window.ethereum directamente si Privy no funciona
        if (!provider && typeof window !== "undefined" && (window as any).ethereum) {
          provider = (window as any).ethereum
        }
        
        if (!provider) {
          throw new Error("Provider no disponible - conecta tu wallet")
        }

        const ethersProvider = new BrowserProvider(provider)
        const network = await ethersProvider.getNetwork()
        const currentChainId = Number(network.chainId)
        
        console.log("[useVerificaContract] Chain detectada:", {
          chainId: currentChainId,
          chainName: network.name,
        })

        // Verificar que la chain está soportada
        const chainCheck = await checkSupportedChain(ethersProvider)
        console.log("[useVerificaContract] Chain check:", chainCheck)
        
        if (!chainCheck.supported) {
          const config = chainCheck.chainId ? getChainConfig(chainCheck.chainId) : null
          const contractAddress = chainCheck.chainId ? getContractAddress(chainCheck.chainId) : null
          
          console.error("[useVerificaContract] Chain no soportada:", {
            chainId: chainCheck.chainId,
            configName: config?.name,
            contractAddress,
            envVar: process.env.NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT,
          })
          
          throw new Error(
            config
              ? `Chain ${config.name} (${chainCheck.chainId}) no tiene contrato configurado. Configura NEXT_PUBLIC_${config.name.toUpperCase().replace(/\s/g, "_")}_CONTRACT en .env`
              : `Chain ${chainCheck.chainId || "desconocida"} no está soportada. Solo Scroll Sepolia (534351) está soportado actualmente. Cambia a Scroll Sepolia en tu wallet.`
          )
        }

        // Verificar que hay dirección de contrato
        const contractAddress = getContractAddress(chainCheck.chainId!)
        if (!contractAddress) {
          const config = getChainConfig(chainCheck.chainId!)
          console.error("[useVerificaContract] No hay dirección de contrato:", {
            chainId: chainCheck.chainId,
            chainName: config?.name,
            envVar: `NEXT_PUBLIC_${config?.name?.toUpperCase().replace(/\s/g, "_")}_CONTRACT`,
          })
          throw new Error(
            `No hay dirección de contrato configurada para ${config?.name || chainCheck.chainId}. Configura NEXT_PUBLIC_${config?.name?.toUpperCase().replace(/\s/g, "_")}_CONTRACT en .env y reinicia el servidor`
          )
        }

        console.log("[useVerificaContract] Contrato encontrado:", {
          chainId: chainCheck.chainId,
          contractAddress,
        })

        setChainId(chainCheck.chainId!)
        setChainSupported(true)

        // Obtener contrato
        const verificaContract = await getVerificaContract(ethersProvider)
        if (!verificaContract) {
          throw new Error("No se pudo obtener el contrato - verifica la dirección en .env")
        }

        setContract(verificaContract)
        console.log("[useVerificaContract] ✅ Contrato cargado exitosamente")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error cargando contrato"
        setError(errorMessage)
        console.error("[useVerificaContract] ❌ Error:", err)
        setChainSupported(false)
      } finally {
        setLoading(false)
      }
    }

    loadContract()
  }, [authenticated, ready, getEthereumProvider])

  /**
   * Registra un documento en blockchain
   * @param recipients Array de direcciones destinatarias (solo ellos pueden firmar)
   */
  const registerDocument = useCallback(
    async (
      documentHash: string,
      ipfsCid: string,
      title: string,
      institution: string,
      recipients: string[], // NUEVO: Array de addresses de destinatarios
      issuedAt?: number
    ) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      if (!recipients || recipients.length === 0) {
        throw new Error("Se requiere al menos un destinatario")
      }

      try {
        setLoading(true)
        const hashBytes32 = hashToBytes32(documentHash)
        const timestamp = issuedAt || Math.floor(Date.now() / 1000)

        // Validar y limpiar addresses
        const validRecipients = recipients
          .filter((addr) => addr && addr.length > 0)
          .map((addr) => addr.toLowerCase())

        if (validRecipients.length === 0) {
          throw new Error("No hay destinatarios válidos")
        }

        // Verificar si el documento ya existe antes de intentar registrarlo
        try {
          const [exists] = await contract.verifyDocument(hashBytes32)
          if (exists) {
            console.log("[useVerificaContract] ⚠️ El documento ya existe en blockchain")
            // Retornar un objeto indicando que ya existe (sin txHash ya que no hubo transacción nueva)
            return {
              success: true,
              alreadyExists: true,
              txHash: null, // No hay nueva transacción
              message: "El documento ya está registrado en blockchain",
            }
          }
        } catch (verifyError) {
          // Si hay error verificando, continuar con el registro (puede que el documento no exista)
          console.log("[useVerificaContract] No se pudo verificar existencia, continuando con registro...")
        }

        console.log("[useVerificaContract] Registrando documento:", {
          hash: hashBytes32,
          ipfsCid,
          title,
          institution,
          recipients: validRecipients,
          recipientsCount: validRecipients.length,
          timestamp,
        })

        const tx = await contract.registerDocument(
          hashBytes32,
          ipfsCid,
          title,
          institution,
          validRecipients, // NUEVO: Pasar destinatarios
          timestamp
        )

        console.log("[useVerificaContract] Transacción enviada:", tx.hash)

        return {
          success: true,
          alreadyExists: false,
          txHash: tx.hash,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error registrando documento"
        
        // Detectar error específico de "Document already exists"
        if (errorMessage.includes("Document already exists") || errorMessage.includes("already exists")) {
          console.log("[useVerificaContract] ⚠️ Documento ya existe (detectado en catch)")
          return {
            success: true,
            alreadyExists: true,
            txHash: null,
            message: "El documento ya está registrado en blockchain",
          }
        }
        
        console.error("[useVerificaContract] Error:", err)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [contract]
  )

  /**
   * Firma un documento
   */
  const signDocument = useCallback(
    async (documentHash: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        setLoading(true)
        const hashBytes32 = hashToBytes32(documentHash)

        const tx = await contract.signDocument(hashBytes32)
        console.log("[useVerificaContract] Firma enviada:", tx.hash)

        return {
          success: true,
          txHash: tx.hash,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error firmando documento"
        console.error("[useVerificaContract] Error:", err)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [contract]
  )

  /**
   * Verifica un documento (view function - sin gas)
   */
  const verifyDocument = useCallback(
    async (documentHash: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        const hashBytes32 = hashToBytes32(documentHash)
        const [exists, document] = await contract.verifyDocument(hashBytes32)

        return {
          exists: exists as boolean,
          document: document as any,
        }
      } catch (err) {
        console.error("[useVerificaContract] Error verificando:", err)
        return {
          exists: false,
          document: null,
        }
      }
    },
    [contract]
  )

  /**
   * Obtiene los documentos de un usuario (como creador o destinatario)
   */
  const getUserDocuments = useCallback(
    async (userAddress: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        const hashes = await contract.getUserDocuments(userAddress)
        return hashes as string[]
      } catch (err) {
        console.error("[useVerificaContract] Error obteniendo documentos:", err)
        return []
      }
    },
    [contract]
  )

  /**
   * Obtiene el CID de IPFS de un documento para recuperar el archivo
   */
  const getDocumentIpfsCid = useCallback(
    async (documentHash: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        const hashBytes32 = hashToBytes32(documentHash)
        const cid = await contract.getDocumentIpfsCid(hashBytes32)
        return cid as string
      } catch (err) {
        console.error("[useVerificaContract] Error obteniendo CID:", err)
        throw err
      }
    },
    [contract]
  )

  /**
   * Verifica si un usuario puede firmar un documento (es destinatario)
   */
  const canSignDocument = useCallback(
    async (documentHash: string, signerAddress: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        const hashBytes32 = hashToBytes32(documentHash)
        const canSign = await contract.canSignDocument(hashBytes32, signerAddress)
        return canSign as boolean
      } catch (err) {
        console.error("[useVerificaContract] Error verificando si puede firmar:", err)
        return false
      }
    },
    [contract]
  )

  /**
   * Obtiene todos los destinatarios de un documento
   */
  const getDocumentRecipients = useCallback(
    async (documentHash: string) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        const hashBytes32 = hashToBytes32(documentHash)
        const recipients = await contract.getDocumentRecipients(hashBytes32)
        return recipients as string[]
      } catch (err) {
        console.error("[useVerificaContract] Error obteniendo destinatarios:", err)
        return []
      }
    },
    [contract]
  )

  // Debug: Log del estado del contrato
  useEffect(() => {
    if (authenticated && ready) {
      console.log("[useVerificaContract] Estado:", {
        chainSupported,
        chainId,
        hasContract: !!contract,
        error,
        loading,
        contractAddress: chainId ? getContractAddress(chainId) : null,
      })
      
      // Si hay error, mostrarlo claramente
      if (error && !loading) {
        console.error("[useVerificaContract] ⚠️ Error detectado:", error)
      }
    }
  }, [authenticated, ready, chainSupported, chainId, contract, error, loading])

  return {
    contract,
    chainId,
    chainSupported,
    loading,
    error,
    registerDocument,
    signDocument,
    verifyDocument,
    getUserDocuments,
    getDocumentIpfsCid,
    canSignDocument,
    getDocumentRecipients,
  }
}

