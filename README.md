# verifica.xyz

> Sistema de transparencia institucional inmutable basado en blockchain

Una plataforma completa para la gestión, verificación y firma de documentos institucionales utilizando tecnología blockchain e IPFS. Garantiza la inmutabilidad, transparencia y trazabilidad de documentos oficiales mediante contratos inteligentes desplegados en múltiples redes.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Características

### 🔐 Autenticación y Roles

- **Autenticación Web3** con Privy (email, wallet, embedded wallets)
- **Sistema de roles**: Alumno, Maestro, Rector
- **Control de acceso** basado en roles y permisos
- **Gestión ENS** para identidades descentralizadas

### 📄 Gestión de Documentos

- **Subida y almacenamiento** en IPFS (Pinata)
- **Registro inmutable** en blockchain (Arbitrum Sepolia, Scroll Sepolia)
- **Firma digital** por destinatarios autorizados
- **Verificación pública** de autenticidad mediante hash
- **Gestión de destinatarios** (individuos o roles completos)

### 🔗 Blockchain Integration

- **Contratos inteligentes** en Solidity (OpenZeppelin)
- **Multi-chain support** (Arbitrum Sepolia, Scroll Sepolia)
- **Registro de documentos** con hash SHA-256
- **Sistema de firmas** on-chain verificables
- **Gestión de destinatarios** descentralizada

### 📦 Almacenamiento

- **IPFS** para archivos (Pinata)
- **Hash SHA-256** para verificación
- **Metadata** en base de datos local/API
- **URLs IPFS** para acceso directo

### 🔔 Notificaciones

- **Notificaciones en tiempo real** de documentos nuevos
- **Alertas de firmas** para creadores
- **Sistema de notificaciones persistente** en localStorage

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** >= 18
- **npm** o **yarn**
- **Cuenta en Privy** ([Dashboard](https://dashboard.privy.io/))
- **Cuenta en Pinata** ([App](https://app.pinata.cloud/)) para IPFS
- **Wallet** configurada (MetaMask o compatible)

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/verifica.xyz.git
cd verifica.xyz
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**

```bash
cp env.example .env
```

Edita `.env` con tus credenciales:

```env
# Privy Authentication (obtén en https://dashboard.privy.io/)
NEXT_PUBLIC_PRIVY_APP_ID=tu_app_id_aqui

# IPFS - Pinata (obtén en https://app.pinata.cloud/api-keys)
PINATA_API_KEY=tu_api_key_aqui
PINATA_SECRET_KEY=tu_secret_key_aqui

# Smart Contracts (después de desplegar)
NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT=0x92774b853732Cd05DAc0dFb4aC215B51a944FF5C
NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT=tu_contrato_scroll_sepolia
```

4. **Iniciar servidor de desarrollo**

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📚 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en http://localhost:3000

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia servidor de producción (después de build)

# Calidad de código
npm run lint         # Ejecuta ESLint para verificar código
```

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS, Shadcn/ui
- **Autenticación**: Privy (email, wallet, embedded wallets)
- **Blockchain**: Ethers.js v6, Solidity
- **Storage**: IPFS (Pinata), localStorage (temporal)
- **Notificaciones**: Sistema personalizado con localStorage
- **Build**: Vercel Analytics

### Estructura del Proyecto

```
verifica.xyz/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── documents/     # CRUD de documentos
│   │   ├── ipfs/          # Upload a IPFS
│   │   └── verify/        # Verificación pública
│   ├── alumno/            # Vista para alumnos
│   ├── create/             # Crear documentos
│   ├── documents/          # Gestión de documentos
│   ├── members/            # Gestión de miembros
│   └── verify/             # Página pública de verificación
├── components/             # Componentes React
│   ├── ui/                # Componentes Shadcn/ui
│   ├── header.tsx         # Header principal
│   └── sidebar.tsx        # Sidebar de navegación
├── hooks/                  # Custom React Hooks
│   ├── use-documents.ts   # Gestión de documentos
│   ├── use-notifications.ts # Sistema de notificaciones
│   ├── use-roles.ts       # Sistema de roles
│   └── use-verifica-contract.ts # Interacción con contratos
├── lib/                    # Utilidades
│   ├── contract-config.ts # Configuración de contratos
│   ├── contract-utils.ts   # Utilidades blockchain
│   ├── documents-storage.ts # Almacenamiento de documentos
│   └── ipfs-utils.ts      # Utilidades IPFS
├── contracts/              # Contratos inteligentes
│   └── VerificaDocuments.sol # Contrato principal
└── public/                 # Archivos estáticos
```

## 🔧 Configuración

### Privy Authentication

1. Crea una cuenta en [Privy Dashboard](https://dashboard.privy.io/)
2. Crea una nueva aplicación
3. Copia el **App ID** y configúralo en `.env` como `NEXT_PUBLIC_PRIVY_APP_ID`
4. Configura métodos de login: email y wallet
5. (Opcional) Configura email para mejorar latencia

### Pinata (IPFS)

1. Crea una cuenta en [Pinata](https://app.pinata.cloud/)
2. Ve a **API Keys** y crea una nueva key
3. Asegúrate de seleccionar permisos de **Admin** (para todos los scopes)
4. Copia **API Key** y **Secret Key** a `.env`

### Smart Contracts

#### Desplegar Contrato

El contrato `VerificaDocuments.sol` debe desplegarse en cada red soportada:

- **Arbitrum Sepolia** (Chain ID: 421614)
- **Scroll Sepolia** (Chain ID: 534351)

Usa [Remix IDE](https://remix.ethereum.org/) o Hardhat para desplegar:

1. Importa el contrato desde `contracts/VerificaDocuments.sol`
2. Compila con Solidity 0.8.20+
3. Conecta MetaMask a la red correcta
4. Despliega el contrato
5. Copia la dirección del contrato a `.env`

#### Autorizar Creadores

Después de desplegar, autoriza las direcciones que pueden crear documentos:

```solidity
// En Remix o tu herramienta
contract.authorizeCreator(0xTuDireccion)
```

Solo el owner del contrato puede autorizar creadores.

## 🌐 Deploy en Vercel

### Pasos

1. **Conectar repositorio** a Vercel
2. **Configurar variables de entorno** en el dashboard:
   - `NEXT_PUBLIC_PRIVY_APP_ID`
   - `PINATA_API_KEY`
   - `PINATA_SECRET_KEY`
   - `NEXT_PUBLIC_ARBITRUM_SEPOLIA_CONTRACT`
   - `NEXT_PUBLIC_SCROLL_SEPOLIA_CONTRACT`
3. **Deploy automático** en cada push a `main`

### Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega todas las variables necesarias.

## 🔐 Sistema de Roles

- **Alumno**: Puede ver y firmar documentos asignados
- **Maestro**: Puede crear documentos y ver/firmar los suyos
- **Rector**: Acceso completo (crear, gestionar miembros, ENS, etc.)

Los roles se determinan basándose en la wallet address del usuario.

## 📝 Flujo de Documentos

1. **Crear documento**: Maestro/Rector sube archivo y metadata
2. **Subir a IPFS**: Archivo se almacena en Pinata y se obtiene CID
3. **Calcular hash**: SHA-256 del archivo para verificación
4. **Registrar en blockchain**: Hash, CID y destinatarios se guardan on-chain
5. **Notificar destinatarios**: Sistema envía notificaciones
6. **Firmar documento**: Destinatarios autorizados firman (on-chain + DB)
7. **Verificar**: Página pública permite verificar autenticidad por hash

## 🛠️ Desarrollo

### Estructura de Hooks

- `useDocuments`: Gestión CRUD de documentos
- `useNotifications`: Sistema de notificaciones en tiempo real
- `useRoles`: Determinación de roles y permisos
- `useVerificaContract`: Interacción con contratos inteligentes
- `useUserWallet`: Gestión de wallet y ENS

### API Routes

- `GET /api/documents`: Listar documentos (filtrado por rol)
- `POST /api/documents`: Crear documento
- `DELETE /api/documents`: Eliminar documento
- `POST /api/documents/[id]/sign`: Firmar documento
- `POST /api/ipfs/upload`: Subir archivo a IPFS
- `GET /api/verify`: Verificar documento públicamente

## 🧪 Testing

```bash
# Ejecutar linter
npm run lint

# Verificar tipos TypeScript
npx tsc --noEmit
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🔗 Enlaces

- **Sitio web**: [verifica.xyz](https://verifica.xyz)
- **Documentación**: [docs.verifica.xyz](https://docs.verifica.xyz)
- **Twitter**: [@IanClavely](https://x.com/IanClavely)

## 👨‍💻 Autor

**Ian Clavely**

- Twitter: [@IanClavely](https://x.com/IanClavely)

---

⭐ Si este proyecto te resulta útil, ¡dale una estrella!
