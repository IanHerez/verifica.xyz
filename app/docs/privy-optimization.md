# Optimización de Privy y Configuración ENS

## 🚀 Optimizaciones Implementadas para Reducir Latencia de Emails

### 1. Configuración en el Dashboard de Privy (IMPORTANTE)

La latencia de emails se puede reducir significativamente configurando un servicio de email en el Dashboard de Privy:

1. **Ve al Dashboard de Privy**: https://dashboard.privy.io/
2. **Settings → Email Configuration**
3. **Configura un servicio de email**:
   - **SendGrid** (recomendado para desarrollo)
   - **AWS SES** (para producción)
   - **Otros proveedores compatibles**

4. **Habilita "Fast Email Delivery"** si está disponible
5. **Verifica tu dominio** para mejor deliverabilidad

**Sin esta configuración**, Privy usa su servicio por defecto que puede ser más lento (puede tardar 30-60 segundos).

**Con servicio configurado**, los emails pueden llegar en 5-15 segundos.

### 2. Configuraciones en el Código

Ya implementamos:

- ✅ `emailVerificationTimeout: 30000` - Timeout de 30 segundos
- ✅ `sessionStorage` con localStorage - Cache de sesiones
- ✅ Soporte para wallets externos (MetaMask, Coinbase Wallet)
- ✅ Configuración de Ethereum mainnet para ENS

## 📝 Configuración de ENS con Privy

### Prerrequisitos

1. Usuario debe estar autenticado con Privy
2. Wallet conectada (embebida o externa)
3. Red: **Ethereum Mainnet** (ENS solo funciona en mainnet)

### Uso del Hook `useENS`

```tsx
import { useENS } from '@/hooks/use-ens'

function MyComponent() {
  const { resolveENS, lookupENS, getMyENS, loading, error } = useENS()

  // Resolver nombre ENS a dirección
  const handleResolve = async () => {
    const address = await resolveENS('vitalik.eth')
    console.log(address) // 0x...
  }

  // Buscar nombre ENS de una dirección
  const handleLookup = async () => {
    const ensName = await lookupENS('0x...')
    console.log(ensName) // vitalik.eth o null
  }

  // Obtener ENS del usuario actual
  const handleGetMyENS = async () => {
    const myENS = await getMyENS()
    console.log(myENS)
  }

  return (
    <div>
      <button onClick={handleResolve} disabled={loading}>
        Resolver ENS
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Funciones de Utilidad

```tsx
import { resolveENS, lookupENS, isValidENS } from '@/lib/web3-utils'
import { BrowserProvider } from 'ethers'
import { usePrivy } from '@privy-io/react-auth'

function Example() {
  const { getEthereumProvider } = usePrivy()

  const checkENS = async () => {
    // Validar formato
    if (!isValidENS('nombre.eth')) {
      console.error('Formato inválido')
      return
    }

    // Obtener provider
    const provider = await getEthereumProvider()
    const ethersProvider = new BrowserProvider(provider)

    // Resolver ENS
    const address = await resolveENS('nombre.eth', ethersProvider)
    
    // Lookup inverso
    const ensName = await lookupENS(address, ethersProvider)
  }
}
```

## ⚙️ Variables de Entorno Requeridas

```bash
# Mínimo requerido
NEXT_PUBLIC_PRIVY_APP_ID=clx...

# Opcional pero recomendado para producción
PRIVY_SECRET_ID=privy_secret_...
```

## 🔧 Configuración de Redes

El `PrivyProvider` está configurado con:

- **Ethereum Mainnet** (chainId: 1) - Para ENS y producción
- **Sepolia Testnet** (chainId: 11155111) - Para desarrollo

### Cambiar Red

Para cambiar a una red diferente, edita `app/providers.tsx`:

```tsx
supportedChains: [
  {
    id: 1, // Cambia el chainId
    name: "Ethereum",
    // ...
  }
]
```

## 📦 Instalación de Dependencias

```bash
npm install ethers@^6.15.0
```

## 🐛 Troubleshooting

### Emails tardan mucho

1. ✅ Configura servicio de email en Dashboard de Privy
2. ✅ Verifica tu dominio
3. ✅ Revisa spam folder
4. ✅ Usa email temporal para pruebas rápidas

### ENS no funciona

1. ✅ Verifica que estés en Ethereum Mainnet (no testnet)
2. ✅ Usuario debe tener wallet conectada
3. ✅ Verifica que el nombre ENS existe (usar https://ens.domains)
4. ✅ Revisa consola para errores

### Provider no disponible

1. ✅ Usuario debe estar autenticado
2. ✅ Wallet debe estar conectada (embedded o externa)
3. ✅ Espera a que Privy inicialice completamente

## 🔗 Recursos

- [Documentación de Privy](https://docs.privy.io/)
- [Dashboard de Privy](https://dashboard.privy.io/)
- [ENS Documentation](https://docs.ens.domains/)
- [Ethers.js Documentation](https://docs.ethers.org/)

