"use client"

import type { ReactNode } from "react"
import { PrivyProvider } from "@privy-io/react-auth"

export function Providers({ children }: ReactNode) {
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
          createOnLogin: "users-without-wallets",
          // Requiere que el usuario confirme antes de crear wallet
          requireUserPasswordOnCreate: false,
          // Red por defecto para wallets embebidas (Ethereum mainnet)
          defaultChain: {
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
          },
        },
        
        // Configuración de email - optimizaciones
        emailConfig: {
          // Reducir timeout para respuestas más rápidas
          emailVerificationTimeout: 30000, // 30 segundos
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
          coinbaseWallet: {
            connectionOptions: "smartWalletOnly",
          },
        },
        
        // Configuración de redes soportadas (para ENS que requiere Ethereum mainnet)
        supportedChains: [
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
          // Sepolia testnet para desarrollo
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
          // Arbitrum Sepolia
          {
            id: 421614,
            name: "Arbitrum Sepolia",
            network: "arbitrum-sepolia",
            nativeCurrency: {
              decimals: 18,
              name: "Ether",
              symbol: "ETH",
            },
            rpcUrls: {
              default: {
                http: ["https://sepolia-rollup.arbitrum.io/rpc"],
              },
            },
            blockExplorers: {
              default: {
                name: "Arbiscan",
                url: "https://sepolia.arbiscan.io",
              },
            },
          },
          // Scroll Sepolia
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
        ],
        
        // Mejorar rendimiento y UX con manejo optimizado de tokens
        sdkOptions: {
          // Cache de sesiones para reducir latencia
          sessionStorage: typeof window !== "undefined" ? window.localStorage : undefined,
          // Pre-cargar access token para reducir latencia en requests
          prefetchAccessToken: true,
        },
        
        // Configuración de almacenamiento de sesión (opcional: HTTP-only cookies)
        // Usa cookies para mejor rendimiento y seguridad (recomendado para producción)
        // sessionStorageMode: "cookie", // Descomenta si quieres usar cookies HTTP-only
      }}
    >
      {children}
    </PrivyProvider>
  )
}
