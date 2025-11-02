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
        const provider = await getEthereumProvider()
        if (!provider) {
          throw new Error("Provider no disponible")
        }

        const ethersProvider = new BrowserProvider(provider)
        
        // Verificar que la chain está soportada
        const chainCheck = await checkSupportedChain(ethersProvider)
        if (!chainCheck.supported) {
          const config = chainCheck.chainId ? getChainConfig(chainCheck.chainId) : null
          throw new Error(
            config
              ? `Chain ${config.name} (${chainCheck.chainId}) no tiene contrato configurado. Configura NEXT_PUBLIC_${config.name.toUpperCase().replace(/\s/g, "_")}_CONTRACT en .env`
              : `Chain ${chainCheck.chainId || "desconocida"} no está soportada. Usa Arbitrum Sepolia (421614) o Scroll Sepolia (534351)`
          )
        }

        setChainId(chainCheck.chainId!)
        setChainSupported(true)

        // Obtener contrato
        const verificaContract = await getVerificaContract(ethersProvider)
        if (!verificaContract) {
          throw new Error("No se pudo obtener el contrato")
        }

        setContract(verificaContract)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error cargando contrato"
        setError(errorMessage)
        console.error("[useVerificaContract] Error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadContract()
  }, [authenticated, ready, getEthereumProvider])

  /**
   * Registra un documento en blockchain
   */
  const registerDocument = useCallback(
    async (
      documentHash: string,
      ipfsCid: string,
      title: string,
      institution: string,
      issuedAt?: number
    ) => {
      if (!contract) {
        throw new Error("Contrato no disponible")
      }

      try {
        setLoading(true)
        const hashBytes32 = hashToBytes32(documentHash)
        const timestamp = issuedAt || Math.floor(Date.now() / 1000)

        console.log("[useVerificaContract] Registrando documento:", {
          hash: hashBytes32,
          ipfsCid,
          title,
          institution,
          timestamp,
        })

        const tx = await contract.registerDocument(
          hashBytes32,
          ipfsCid,
          title,
          institution,
          timestamp
        )

        console.log("[useVerificaContract] Transacción enviada:", tx.hash)
        
        // Esperar confirmación (opcional - puedes retornar el hash inmediatamente)
        // const receipt = await tx.wait()
        // console.log("[useVerificaContract] Transacción confirmada:", receipt)

        return {
          success: true,
          txHash: tx.hash,
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error registrando documento"
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
   * Obtiene los documentos de un usuario
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
  }
}

