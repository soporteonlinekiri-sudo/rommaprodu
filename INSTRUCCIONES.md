# ¡Qué Peña! — Backend MercadoPago

## Cómo deployar en Vercel

### 1. Crear repo en GitHub
- Ir a github.com → New repository
- Nombre: `quepena-backend`
- Privado ✓
- Subir estos archivos:
  - api/create-preference.js
  - vercel.json

### 2. Importar en Vercel
- vercel.com → Add New Project
- Importar el repo `quepena-backend`
- Click en Deploy (sin cambiar nada)

### 3. Agregar el Access Token de MP
- Vercel → tu proyecto → Settings → Environment Variables
- Name:  MP_ACCESS_TOKEN
- Value: tu Access Token (APP_USR-...)
- Click en Save
- Ir a Deployments → Redeploy

### 4. Copiar la URL de Vercel
- Te va a quedar algo como: https://quepena-backend.vercel.app
- Esa URL va en la app (ver paso 5)

### 5. Actualizar la app en Netlify
En quepena_reservas.html buscar esta línea:
  const BACKEND_URL = "https://TU-PROYECTO.vercel.app";
Reemplazar con tu URL real y volver a subir el HTML a Netlify.
