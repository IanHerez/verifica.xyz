"use client"

import type { ReactNode } from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { AutoSwitchChain } from "@/components/auto-switch-chain"

export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Métodos de login disponibles
        loginMethods: ["email", "wallet"],
        
        // Configuración de wallets embebidas
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        
        // Red por defecto para wallets embebidas (Scroll Sepolia)
        defaultChain: {
          id: 534351,
          name: "Scroll Sepolia",
          network: "scroll-sepolia",
          nativeCurrency: {
            decimals: 18,
            name: "Ether",
            symbol: "ETH",
          },
          rpcUrls: {
            default: {
              http: ["https://sepolia-rpc.scroll.io"],
            },
          },
          blockExplorers: {
            default: {
              name: "Scrollscan",
              url: "https://sepolia.scrollscan.com",
            },
          },
        },
        
        // Configuración de UI
        appearance: {
          theme: "light",
          accentColor: "#6366f1",
          // Logo para modales de Privy (URL absoluta necesaria)
          logo: typeof window !== "undefined" ? `${window.location.origin}/verifica logo.png` : undefined,
        },
        
        // Métodos de wallet externos habilitados (para ENS)
        externalWallets: {
          // MetaMask y otros wallets compatibles con EIP-1193
          // coinbaseWallet se configura automáticamente
        },
        
        // Configuración de redes soportadas
        // Scroll Sepolia es la única chain soportada para contratos
        // Ethereum mainnet y Sepolia se mantienen solo para funcionalidad ENS
        supportedChains: [
          // Scroll Sepolia (Chain principal - única soportada para contratos)
          {
            id: 534351,
            name: "Scroll Sepolia",
            network: "scroll-sepolia",
            nativeCurrency: {
              decimals: 18,
              name: "Ether",
              symbol: "ETH",
            },
            rpcUrls: {
              default: {
                http: ["https://sepolia-rpc.scroll.io"],
              },
            },
            blockExplorers: {
              default: {
                name: "Scrollscan",
                url: "https://sepolia.scrollscan.com",
              },
            },
          },
          // Ethereum mainnet (solo para ENS)
          {
            id: 1,
            name: "Ethereum",
            network: "mainnet",
            nativeCurrency: {
              decimals: 18,
              name: "Ether",
              symbol: "ETH",
            },
            rpcUrls: {
              default: {
                http: ["https://eth.llamarpc.com"],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://etherscan.io",
              },
            },
          },
          // Sepolia testnet
          {
            id: 11155111,
            name: "Sepolia",
            network: "sepolia",
            nativeCurrency: {
              decimals: 18,
              name: "Ether",
              symbol: "ETH",
            },
            rpcUrls: {
              default: {
                http: ["https://sepolia.infura.io/v3/"],
              },
            },
            blockExplorers: {
              default: {
                name: "Etherscan",
                url: "https://sepolia.etherscan.io",
              },
            },
          },
        ],
      }}
    >
      <AutoSwitchChain />
      {children}
    </PrivyProvider>
  )
}
