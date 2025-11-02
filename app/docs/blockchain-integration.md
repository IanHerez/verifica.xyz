# Guía de Integración Blockchain

## Configuración de Reown AppKit

Para integrar Web3 wallet connectivity con Reown AppKit:

1. Regístrate en https://cloud.reown.com/
2. Crea un nuevo proyecto y obtén tu Project ID
3. Reemplaza `YOUR_PROJECT_ID` en la configuración de AppKit
4. Configura las redes soportadas (Ethereum, Polygon, etc.)

## Funciones Disponibles

### formatAddress
Formatea direcciones Ethereum para visualización:
\`\`\`ts
formatAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E')
// Returns: '0x742d...2d1E'
\`\`\`

### isValidAddress
Valida si una cadena es una dirección Ethereum válida:
\`\`\`ts
isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f42d1E') // true
isValidAddress('invalid') // false
\`\`\`

### hashDocument
Genera un hash SHA-256 de un documento para certificación blockchain:
\`\`\`ts
const hash = await hashDocument(documentContent)
\`\`\`

### isValidENS
Valida nombres ENS:
\`\`\`ts
isValidENS('juan.eth') // true
isValidENS('invalid-name') // false
\`\`\`

## Ejemplo de Uso

\`\`\`tsx
import { useWeb3 } from '@/hooks/use-web3'
import { ConnectedWalletDisplay } from '@/components/connected-wallet-display'

export function WalletExample() {
  const { address, isConnected, connect, disconnect } = useWeb3()

  if (isConnected && address) {
    return (
      <ConnectedWalletDisplay 
        address={address} 
        onDisconnect={disconnect}
      />
    )
  }

  return <button onClick={connect}>Conectar Wallet</button>
}
\`\`\`

## Componentes Disponibles

- `<ConnectedWalletDisplay />` - Muestra wallet conectado
- `<DocumentBlockchainCert />` - Certificado blockchain del documento
- `<BlockchainBadge />` - Estado de verificación blockchain
