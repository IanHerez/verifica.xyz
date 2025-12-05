"use client"

import { useEffect, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { BrowserProvider } from "ethers"

/**
 * Componente que automáticamente cambia a Scroll Sepolia después del login
 * 
 * Esto asegura que los usuarios siempre estén en la chain correcta,
 * especialmente cuando se conectan con wallets externas que pueden estar en otras chains
 */
const SCROLL_SEPOLIA_CHAIN_ID = 534351

export function AutoSwitchChain() {
  const { authenticated, ready, getEthereumProvider } = usePrivy()
  const hasSwitchedRef = useRef(false)

  useEffect(() => {
    // Solo ejecutar una vez cuando el usuario se autentica
    if (!authenticated || !ready || hasSwitchedRef.current) {
      return
    }

    const switchToScroll = async () => {
      try {
        // Pequeño delay para asegurar que Privy está completamente inicializado
        await new Promise((resolve) => setTimeout(resolve, 500))

        const provider = await getEthereumProvider()
        if (!provider) {
          console.log("[AutoSwitchChain] No provider disponible aún")
          return
        }

        const ethersProvider = new BrowserProvider(provider)
        const network = await ethersProvider.getNetwork()
        const currentChainId = Number(network.chainId)

        console.log("[AutoSwitchChain] Chain actual:", {
          chainId: currentChainId,
          chainName: network.name,
        })

        // Si ya estamos en Scroll Sepolia, no hacer nada
        if (currentChainId === SCROLL_SEPOLIA_CHAIN_ID) {
          console.log("[AutoSwitchChain] Ya estamos en Scroll Sepolia")
          hasSwitchedRef.current = true
          return
        }

        // Intentar cambiar a Scroll Sepolia
        console.log("[AutoSwitchChain] Cambiando a Scroll Sepolia...")

        // Método 1: Usar wallet_switchEthereumChain si está disponible
        if (provider && typeof provider.request === "function") {
          try {
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${SCROLL_SEPOLIA_CHAIN_ID.toString(16)}` }],
            })
            console.log("[AutoSwitchChain] ✅ Cambiado a Scroll Sepolia exitosamente")
            hasSwitchedRef.current = true
            return
          } catch (switchError: any) {
            // Error 4902 significa que la chain no está agregada a la wallet
            if (switchError.code === 4902) {
              console.log("[AutoSwitchChain] Scroll Sepolia no está agregada, agregando...")
              
              // Agregar la chain a la wallet
              try {
                await provider.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: `0x${SCROLL_SEPOLIA_CHAIN_ID.toString(16)}`,
                      chainName: "Scroll Sepolia",
                      nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      rpcUrls: ["https://sepolia-rpc.scroll.io"],
                      blockExplorerUrls: ["https://sepolia.scrollscan.com"],
                    },
                  ],
                })
                console.log("[AutoSwitchChain] ✅ Scroll Sepolia agregada y cambiada exitosamente")
                hasSwitchedRef.current = true
                return
              } catch (addError) {
                console.error("[AutoSwitchChain] Error agregando Scroll Sepolia:", addError)
              }
            } else {
              console.error("[AutoSwitchChain] Error cambiando a Scroll Sepolia:", switchError)
            }
          }
        }

        // Método 2: Usar window.ethereum directamente como fallback
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const ethereum = (window as any).ethereum
          try {
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${SCROLL_SEPOLIA_CHAIN_ID.toString(16)}` }],
            })
            console.log("[AutoSwitchChain] ✅ Cambiado a Scroll Sepolia (fallback) exitosamente")
            hasSwitchedRef.current = true
          } catch (fallbackError: any) {
            if (fallbackError.code === 4902) {
              try {
                await ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: `0x${SCROLL_SEPOLIA_CHAIN_ID.toString(16)}`,
                      chainName: "Scroll Sepolia",
                      nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                      },
                      rpcUrls: ["https://sepolia-rpc.scroll.io"],
                      blockExplorerUrls: ["https://sepolia.scrollscan.com"],
                    },
                  ],
                })
                console.log("[AutoSwitchChain] ✅ Scroll Sepolia agregada (fallback) exitosamente")
                hasSwitchedRef.current = true
              } catch (addError) {
                console.error("[AutoSwitchChain] Error agregando Scroll Sepolia (fallback):", addError)
              }
            } else {
              console.error("[AutoSwitchChain] Error cambiando a Scroll Sepolia (fallback):", fallbackError)
            }
          }
        }
      } catch (error) {
        console.error("[AutoSwitchChain] Error general:", error)
      }
    }

    switchToScroll()
  }, [authenticated, ready, getEthereumProvider])

  // Este componente no renderiza nada
  return null
}

