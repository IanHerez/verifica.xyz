# Sistema ENS por Email

## Resumen

El sistema ahora permite **asociar un ENS a un email** en lugar de solo a una wallet. Esto permite mayor flexibilidad y permite que usuarios compartan el mismo ENS o tengan ENS independientes de su wallet específica.

## Prioridad de ENS

El sistema usa esta prioridad para determinar qué ENS mostrar:

1. **ENS asociado al email** (prioridad más alta)
2. **ENS de la wallet** (fallback si no hay asociación por email)

## Cómo Funciona

### 1. Asociación Email → ENS

```typescript
import { useEmailENS } from "@/hooks/use-email-ens";

function MyComponent() {
  const { associateENS, ensName } = useEmailENS();

  // Asociar un ENS al email del usuario
  const success = await associateENS("mi-nombre.eth");
  // ensName ahora mostrará 'mi-nombre.eth'
}
```

### 2. Almacenamiento

Las asociaciones se guardan en `localStorage` con la clave `email_ens_mappings`:

```json
[
  {
    "email": "usuario@ejemplo.com",
    "ensName": "mi-nombre.eth",
    "walletAddress": "0x...",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
]
```

### 3. Búsqueda Automática

Cuando un usuario inicia sesión:

1. Se obtiene su email de Privy
2. Se busca si hay un ENS asociado a ese email
3. Si existe, se usa ese ENS
4. Si no existe, se busca ENS de la wallet (fallback)

## Uso en Componentes

### Hook `useEmailENS`

```typescript
const {
  ensName, // ENS final (prioriza email, luego wallet)
  emailENS, // ENS específico del email (null si no hay)
  walletENS, // ENS de la wallet (fallback)
  associateENS, // Función para asociar ENS a email
  removeAssociation, // Eliminar asociación
  checkENSAvailability, // Verificar si ENS está disponible
  userEmail, // Email del usuario
  hasEmailAssociation, // true si hay asociación por email
} = useEmailENS();
```

### Ejemplo Completo

```typescript
"use client";

import { useEmailENS } from "@/hooks/use-email-ens";

function ENSPage() {
  const {
    ensName,
    emailENS,
    associateENS,
    removeAssociation,
    checkENSAvailability,
  } = useEmailENS();

  const handleAssociate = async (ensName: string) => {
    // Verificar disponibilidad
    const check = await checkENSAvailability(ensName);
    if (!check.available) {
      alert(check.reason);
      return;
    }

    // Asociar
    const success = await associateENS(ensName);
    if (success) {
      alert(`ENS ${ensName} asociado a tu email`);
    }
  };

  return (
    <div>
      <h2>Tu ENS: {ensName || "No configurado"}</h2>
      {emailENS && <p>Asociado a email: {emailENS}</p>}
    </div>
  );
}
```

## Validaciones

### Al Asociar ENS

1. ✅ Verifica que el ENS esté bien formateado (termina en `.eth`)
2. ✅ Verifica que el ENS exista en blockchain
3. ✅ Verifica que el ENS no esté asociado a otro email
4. ✅ Resuelve el ENS para confirmar que existe

### Mensajes de Error

- `"Nombre ENS inválido"` - El formato no es válido
- `"ENS no existe en blockchain"` - El ENS no está registrado
- `"ENS ya está asociado a otro email"` - Otro usuario ya lo tiene

## Ventajas del Sistema

### ✅ Flexibilidad

- Un usuario puede tener diferentes wallets pero mantener el mismo ENS
- Múltiples usuarios pueden compartir un ENS (si está configurado para múltiples wallets)
- ENS independiente de la wallet específica

### ✅ Persistencia

- La asociación se guarda en localStorage
- Persiste entre sesiones
- No requiere wallet para asociar ENS (solo para verificar que existe)

### ✅ Fallback Inteligente

- Si no hay ENS por email, usa ENS de wallet automáticamente
- Transición suave entre sistemas
- Compatible con el sistema anterior

## Limitaciones

1. **Almacenamiento Local**: Las asociaciones se guardan en `localStorage` del navegador

   - Se pierden si el usuario limpia el navegador
   - No se sincronizan entre dispositivos
   - **Solución futura**: Mover a backend/database

2. **Verificación en Blockchain**: Requiere conexión a Ethereum mainnet

   - No funciona offline
   - Depende de que el provider esté disponible

3. **Un ENS por Email**: Cada email solo puede tener un ENS asociado
   - Si quieres cambiar, debes eliminar la asociación actual

## Migración desde Sistema Anterior

El sistema es **compatible hacia atrás**:

- Si un usuario tiene ENS de wallet, se muestra automáticamente
- Si asocia un ENS por email, se prioriza sobre el de wallet
- Si elimina la asociación por email, vuelve a mostrar el de wallet

## Próximas Mejoras

1. **Backend Storage**: Mover asociaciones a base de datos
2. **Multi-dispositivo**: Sincronización entre dispositivos
3. **Historial**: Guardar historial de asociaciones
4. **Validación de Propiedad**: Verificar que el usuario posea el ENS antes de asociarlo

## Referencias

- [Hook useEmailENS](/hooks/use-email-ens.ts)
- [Storage email-ens-storage](/lib/email-ens-storage.ts)
- [Página de Gestión ENS](/app/ens/page.tsx)
