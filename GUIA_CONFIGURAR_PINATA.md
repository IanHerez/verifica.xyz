# 📦 Guía: Configurar Pinata para IPFS

## 🎯 ¿Qué es Pinata?

Pinata es un servicio que permite almacenar archivos en IPFS (InterPlanetary File System). En Verifica, lo usamos para almacenar los documentos PDF de forma descentralizada.

## 📋 Paso a Paso

### Paso 1: Crear Cuenta en Pinata

1. **Abrir Pinata**

   - Ve a https://app.pinata.cloud/
   - O directamente: https://www.pinata.cloud/

2. **Registrarse**

   - Click en "Sign Up" o "Get Started"
   - Puedes registrarte con:
     - Email y contraseña
     - Google Account
     - GitHub Account (recomendado)
   - Completa el proceso de registro
   - Verifica tu email si es necesario

3. **Acceder al Dashboard**
   - Una vez registrado, serás redirigido al Dashboard
   - Verás tu panel de control de Pinata

### Paso 2: Obtener API Keys

1. **Ir a API Keys**

   - En el menú lateral izquierdo, busca "API Keys"
   - Click en "API Keys" o ve directamente a: https://app.pinata.cloud/developers/api-keys

2. **Crear Nueva API Key**

   - Click en el botón **"New Key"** o **"+ New Key"**
   - Se abrirá un formulario

3. **Configurar la Key**

   - **Key Name:** Puedes usar cualquier nombre, ej: `Verifica Documents` o `Mi App`
   - **Admin:** Deja marcado (necesitas permisos completos)
   - **Pinata Policies:** Puedes dejar el default o configurar límites (opcional)
     - Si quieres límites, configura:
       - **Max Upload Size:** 10MB (recomendado)
       - **Pinata Regions:** Selecciona las que prefieras
   - Click en **"Create Key"** o **"Save"**

4. **Copiar las Keys**
   ⚠️ **IMPORTANTE:** Pinata solo mostrará las keys UNA vez. Cópialas inmediatamente.

   Verás dos valores:

   - **API Key** (o `JWT`): Una cadena larga que empieza con algo como `eyJ...`
   - **Secret Key** (o `Secret`): Otra cadena larga

   **Copia ambos valores inmediatamente** y guárdalos en un lugar seguro.

### Paso 3: Configurar en el Proyecto

1. **Abrir tu archivo `.env`**

   - Ve a la raíz de tu proyecto
   - Abre el archivo `.env` (si no existe, créalo copiando de `env.example`)

2. **Agregar las Keys**

   - Busca la sección de IPFS/Pinata
   - O agrega estas líneas:

   ```env
   # IPFS - Pinata
   PINATA_API_KEY=tu_api_key_aqui
   PINATA_SECRET_KEY=tu_secret_key_aqui
   ```

3. **Reemplazar con tus Keys**

   - Reemplaza `tu_api_key_aqui` con tu **API Key** de Pinata (la que empieza con `eyJ...`)
   - Reemplaza `tu_secret_key_aqui` con tu **Secret Key** de Pinata

   **Ejemplo:**

   ```env
   PINATA_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI...
   PINATA_SECRET_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yzab567cde890
   ```

4. **Guardar el archivo**
   - Guarda el archivo `.env`
   - **IMPORTANTE:** Asegúrate de que el archivo `.env` esté en `.gitignore` (no debe subirse al repositorio)

### Paso 4: Reiniciar el Servidor

1. **Detener el servidor**

   - Si tienes el servidor corriendo (`npm run dev`), deténlo con `Ctrl+C`

2. **Reiniciar**

   - Inicia el servidor de nuevo:
     ```bash
     npm run dev
     ```

   ⚠️ **CRÍTICO:** Las variables de entorno (`PINATA_API_KEY` y `PINATA_SECRET_KEY`) solo se cargan cuando inicia el servidor. **Debes reiniciar** después de agregarlas.

### Paso 5: Probar

1. **Abrir la aplicación**

   - Ve a http://localhost:3000
   - Inicia sesión (conecta tu wallet)

2. **Intentar crear un documento**

   - Ve a `/create` o "Crear Documento"
   - Selecciona un archivo PDF
   - Completa el formulario
   - Click en "Publicar" o "Crear Documento"

3. **Verificar que funcione**
   - Deberías ver que el archivo se sube a IPFS
   - No deberías ver el error "IPFS no configurado"
   - El documento se debería crear exitosamente

## ✅ Checklist

- [ ] Cuenta creada en Pinata (https://app.pinata.cloud/)
- [ ] API Key creada en Pinata Dashboard
- [ ] API Key copiada (valor largo que empieza con `eyJ...`)
- [ ] Secret Key copiada
- [ ] Ambas keys agregadas en `.env`
- [ ] Archivo `.env` guardado
- [ ] Servidor Next.js reiniciado
- [ ] Prueba de subida de archivo exitosa

## 🐛 Troubleshooting

### Error: "IPFS no configurado"

**Causa:** Las variables de entorno no están configuradas o el servidor no se reinició.

**Solución:**

1. Verifica que `.env` tenga las dos variables:
   ```env
   PINATA_API_KEY=tu_key_aqui
   PINATA_SECRET_KEY=tu_secret_aqui
   ```
2. Asegúrate de que NO tengan comillas alrededor
3. Reinicia el servidor completamente
4. Verifica que no haya espacios extra antes/después de los valores

### Error: "Invalid API Key" o "Unauthorized"

**Causa:** Las keys están incorrectas o expiradas.

**Solución:**

1. Ve a Pinata Dashboard → API Keys
2. Verifica que la key esté activa
3. Si es necesario, crea una nueva key y actualiza `.env`
4. Reinicia el servidor

### Error: "File too large"

**Causa:** El archivo supera el límite de Pinata (por defecto 10MB en el código).

**Solución:**

- Reduce el tamaño del archivo, o
- Configura un límite mayor en Pinata Dashboard (Plan Pago requerido)

### No veo mis archivos en Pinata Dashboard

**Causa:** Los archivos se suben automáticamente pero pueden no aparecer en el Dashboard inmediatamente.

**Solución:**

- Los archivos están en IPFS y son accesibles por su CID
- Puedes verificar el CID en la base de datos o en los logs del servidor
- Opcional: Ve a Pinata Dashboard → Files para ver todos tus pins

## 📝 Notas Importantes

1. **Seguridad:**

   - ❌ NUNCA subas el archivo `.env` al repositorio
   - ✅ Verifica que `.env` esté en `.gitignore`
   - ✅ Las API Keys son sensibles - no las compartas

2. **Límites de Pinata (Plan Gratuito):**

   - 1GB de almacenamiento
   - 1000 archivos por mes
   - Para más, necesitas un plan pago

3. **IPFS vs Base de Datos:**

   - Los archivos se almacenan en IPFS (descentralizado)
   - Los metadatos (título, descripción, etc.) se guardan en la base de datos local
   - El CID (hash) del archivo se guarda en blockchain y base de datos

4. **Gateway de IPFS:**
   - Por defecto se usa: `https://gateway.pinata.cloud/ipfs/`
   - Los archivos son accesibles desde cualquier gateway de IPFS
   - Ejemplo: `https://ipfs.io/ipfs/QmHash...` también funciona

## 🔗 Enlaces Útiles

- **Pinata Dashboard:** https://app.pinata.cloud/
- **Documentación Pinata:** https://docs.pinata.cloud/
- **API Keys:** https://app.pinata.cloud/developers/api-keys
- **Files:** https://app.pinata.cloud/pinmanager

## 💡 Tips

- **Testing:** Puedes probar primero con archivos pequeños (< 1MB)
- **Nombres de Keys:** Usa nombres descriptivos para tus API Keys (ej: "Verifica Dev", "Verifica Prod")
- **Múltiples Keys:** Puedes crear diferentes keys para desarrollo y producción
- **Monitoreo:** Ve a Pinata Dashboard para ver el uso y límites
