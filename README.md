# Verifica

Sistema de transparencia institucional inmutable basado en blockchain.

## 🚀 Deploy en Vercel

Este proyecto está listo para deploy en Vercel. Configura las siguientes variables de entorno:

### Variables de Entorno Requeridas

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=tu_app_id_aqui

# IPFS - Pinata
PINATA_API_KEY=tu_api_key_aqui
PINATA_SECRET_KEY=tu_secret_key_aqui

# Smart Contracts
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=tu_contrato_scroll_sepolia
```

### Pasos para Deploy

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push a `main`

## 📦 Instalación Local

```bash
npm install
# o
yarn install
```

## 🏃 Desarrollo

```bash
npm run dev
# o
yarn dev
```

## 📝 Tecnologías

- Next.js 16
- React 19
- Privy (Autenticación Web3)
- Ethers.js (Blockchain)
- Pinata (IPFS)
- Tailwind CSS
- TypeScript
