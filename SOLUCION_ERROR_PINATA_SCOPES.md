# 🔧 Solución: Error "NO_SCOPES_FOUND" en Pinata

## 🐛 Error

```
Error de Pinata: {"error":{"reason":"NO_SCOPES_FOUND","details":"This key does not have the required scopes associated with it"}}
```

## ❌ Problema

Tu API key de Pinata no tiene los **scopes (permisos)** necesarios para subir archivos a IPFS.

## ✅ Solución

Tienes **dos opciones**:

### Opción 1: Editar la API Key Existente (Si es posible)

1. **Ve a Pinata Dashboard**

   - Abre https://app.pinata.cloud/
   - Ve a "API Keys" en el menú lateral

2. **Editar la Key**

   - Busca tu API key (la que estás usando)
   - Click en el ícono de editar o configuración
   - Busca la sección de **"Scopes"** o **"Permissions"**

3. **Habilitar Permisos**

   - Asegúrate de que estos permisos estén **marcados/activados**:
     - ✅ **pinFileToIPFS** (CRÍTICO - necesario para subir archivos)
     - ✅ **pinJSONToIPFS** (opcional)
     - ✅ **unpin** (opcional)
   - Si hay una opción **"Admin"**, actívala (incluye todos los permisos)

4. **Guardar**

   - Click en "Save" o "Update"
   - Espera unos segundos para que se apliquen los cambios

5. **Probar de nuevo**
   - Intenta subir un archivo nuevamente en tu aplicación

### Opción 2: Crear una Nueva API Key con Permisos Correctos (RECOMENDADO)

Si no puedes editar la key o prefieres crear una nueva:

1. **Ir a API Keys**

   - Ve a https://app.pinata.cloud/developers/api-keys
   - Click en **"New Key"** o **"+ New Key"**

2. **Configurar la Key Correctamente**

   **Configuración Básica:**

   - **Key Name:** `Verifica Documents - Full Access`
   - **Admin:** ✅ **MARCAR ESTA OPCIÓN** (incluye todos los permisos)

   **Configuración Avanzada (opcional):**

   - Si no quieres usar "Admin", busca la sección de **Scopes** o **Permissions**:
     - ✅ Marca **pinFileToIPFS** (requerido)
     - ✅ Marca **pinJSONToIPFS** (opcional pero útil)
     - ✅ Marca **unpin** (opcional, para eliminar archivos)

   **Pinata Policies (opcional):**

   - Puedes dejar los valores por defecto
   - O configurar límites:
     - **Max Upload Size:** 10MB o el que prefieras

3. **Crear la Key**

   - Click en **"Create Key"** o **"Save"**

4. **Copiar las Nuevas Keys**
   ⚠️ **IMPORTANTE:** Solo se mostrarán una vez

   - **API Key:** Copia el valor largo (empieza con `eyJ...`)
   - **Secret Key:** Copia el valor secreto

5. **Actualizar `.env`**

   - Abre tu archivo `.env`
   - Reemplaza los valores antiguos:
     ```env
     PINATA_API_KEY=tu_nueva_api_key_aqui
     PINATA_SECRET_KEY=tu_nuevo_secret_key_aqui
     ```

6. **Reiniciar Servidor**

   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```

7. **Probar**
   - Intenta subir un archivo nuevamente
   - Debería funcionar ahora

## 🔍 Verificar Permisos

Si quieres verificar qué permisos tiene tu key actual:

1. Ve a Pinata Dashboard → API Keys
2. Click en tu key para ver detalles
3. Busca la sección "Scopes" o "Permissions"
4. Verifica que tenga al menos `pinFileToIPFS`

## 📋 Checklist de Solución

- [ ] Verificaste los scopes de tu API key actual
- [ ] Creaste una nueva key con permisos "Admin" o con `pinFileToIPFS` habilitado
- [ ] Copiaste las nuevas keys (API Key y Secret Key)
- [ ] Actualizaste `.env` con las nuevas keys
- [ ] Reiniciaste el servidor Next.js
- [ ] Probaste subir un archivo nuevamente

## 💡 Tips

- **Recomendación:** Usa la opción "Admin" al crear la key - es más fácil y evita problemas de permisos
- **Eliminar keys antiguas:** Puedes eliminar las keys viejas que no funcionan desde el Dashboard
- **Múltiples keys:** Puedes tener varias keys activas, útil para desarrollo/producción separados

## 🆘 Si sigue sin funcionar

1. **Verifica el formato:**

   - Las keys NO deben tener comillas en `.env`
   - No debe haber espacios antes/después de los valores
   - Ejemplo correcto:
     ```env
     PINATA_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

2. **Verifica que el servidor se reinició:**

   - Las variables de entorno solo se cargan al iniciar
   - Asegúrate de detener completamente (Ctrl+C) y reiniciar

3. **Revisa los logs:**
   - Si hay más errores, compártelos para diagnosticar
