# Verificación Automática de Rotulado – Frontend

Este repositorio contiene la interfaz web del sistema de inspección de etiquetas desarrollada para el Trabajo Fin de Máster. La aplicación permite configurar los valores esperados de producción, capturar o cargar imágenes del producto y enviarlas a un pipeline de Azure Functions que realiza OCR, verificación de código de barras y validación contra los parámetros configurados.

La solución está construida con **Next.js 15 (App Router)**, **React 19** y **TypeScript**, emplea **Tailwind CSS 4** para la capa visual y utiliza **Zustand** para el estado global con persistencia en `sessionStorage`. El backend serverless expuesto por Next.js actúa como intermediario frente a servicios de Azure y, durante el desarrollo, se apoya en `json-server` y Docker para disponer de mocks y base de datos PostgreSQL.

---

## Capacidades clave

- **Flujo guiado de inspección** mediante dos pestañas principales: configuración de valores esperados y procesamiento de imágenes. (`src/app/page.tsx`)
- **Selección de origen de imagen** desde archivo o cámara, con compresión automática antes de su envío para optimizar transferencia. (`src/components/uploader` + `src/lib/image.ts`)
- **Integración con Azure Functions** para solicitar SAS de carga, subir la imagen, iniciar el pipeline y recuperar resultados y overlays temporales. (`src/app/api/azure-analyze/route.ts` + `src/server/azure.ts`)
- **Visualización detallada del OCR y códigos de barras** con componentes dedicados, copia de resultados y enlaces a imágenes generadas por la automatización. (`src/components/processing`)
- **Validación automática** que contrasta lote, vencimiento, orden y estado del código de barras, actualizando contadores de inspecciones aprobadas/rechazadas. (`src/lib/store.ts` + `src/components/StatusSummary.tsx`)
- **Persistencia de configuraciones** y fuente seleccionada mediante Zustand + `sessionStorage`, manteniendo el contexto del operador entre recargas. (`src/lib/store.ts`)
- **Fallbacks de datos mock** que aseguran funcionamiento sin servicios externos gracias a `json-server` y rutas API internas. (`mocks/` + `src/app/api/expected/route.ts`)

---

## Arquitectura técnica

### Frontend
- **Next.js 15 con App Router** y renderizado híbrido (SSR/CSR). El layout global define cabecera, pie y esqueleto de carga (`src/app/layout.tsx`, `src/components/AppSkeleton.tsx`).
- **Componentización** con shadcn/ui y Radix UI para tabs, tarjetas, tooltips y badges (`src/components/ui`).
- **Estado global** gestionado por `useAppStore` (Zustand) con middleware de persistencia y devtools activados en desarrollo. (`src/lib/store.ts`)
- **Manejo de imágenes** mediante `react-dropzone` y `react-webcam`, aplicando reducción de tamaño y compresión antes de subir archivos. (`src/components/uploader/` + `src/lib/image.ts`)

### Backend Next.js
- **Ruta `POST /api/azure-analyze`**: recibe la imagen, solicita SAS de carga, sube el blob, inicia el pipeline, realiza polling del Durable Function y retorna URLs temporales para los artefactos generados junto con JSON de OCR, barcode y validaciones. (`src/app/api/azure-analyze/route.ts`)
- **Helpers server-only** para encapsular las llamadas HTTP a Azure Functions (obtener SAS, subir blobs, iniciar y consultar pipeline). (`src/server/azure.ts`)
- **Ruta `GET /api/expected`** como fallback que lee `mocks/db.json` cuando no está activo `json-server`, manteniendo el mismo contrato de datos. (`src/app/api/expected/route.ts`)

### Persistencia y datos
- **Prisma ORM** configurado contra PostgreSQL para registrar historiales (`Processing`) y regiones de interés (`ROI`). (`prisma/schema.prisma`)
- **Docker Compose** provee un contenedor PostgreSQL con credenciales prefijadas para desarrollo local. (`docker/docker-compose.yml`)
- Aunque el frontend aún no persiste registros automáticamente, el esquema y cliente Prisma (`src/server/prisma.ts`) están preparados para extender las rutas API.

### Estilos y accesibilidad
- Tailwind CSS 4 con variables temáticas personalizadas y soporte claro/oscuro. (`src/styles/globals.css`)
- Componentes responsive con tipografía `Geist` y patrones de UI consistentes (secciones colapsables, tarjetas con encabezado de estado, badges booleanos, etc.).

---

## Requisitos previos

1. **Node.js ≥ 18.18** y **pnpm ≥ 9** (se recomienda `corepack enable`).
2. **Docker Desktop** o un runtime compatible para levantar PostgreSQL localmente.
3. Credenciales de **Azure Functions** con permisos para solicitar SAS (`/api/sas`) e iniciar el proceso (`/api/process`).
4. (Opcional) Prisma CLI (`pnpm prisma:...`) y cliente SQL para inspeccionar la base.

---

## Puesta en marcha rápida

1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Crear un archivo `.env.local` en la raíz con las variables listadas en la siguiente sección.
3. Levantar los servicios de desarrollo completos:
   ```bash
   pnpm dev
   ```
   - Ejecuta `docker compose` para PostgreSQL (`pnpm docker:up`).
   - Inicia Next.js con Turbopack en `http://localhost:3000` (`pnpm dev:next`).
   - Arranca `json-server` con los mocks en `http://localhost:4000` (`pnpm dev:mock`).
4. Para detener los contenedores de base de datos:
   ```bash
   pnpm docker:down
   ```

### Ejecución granular
- `pnpm dev:next`: sólo la aplicación Next.js.
- `pnpm dev:mock`: sólo los mocks REST.
- `pnpm docker:up`: levanta PostgreSQL sin iniciar la app.

---

## Variables de entorno

Crear `.env.local` con los valores apropiados para el entorno:

```bash
# Host del Function App (sin protocolo)
AZURE_FUNC_HOST=mi-funcion.azurewebsites.net

# Claves de las funciones HTTP (portal de Azure)
AZURE_FUNC_KEY_GET_SAS=clave-generada-para-sas
AZURE_FUNC_KEY_HTTP_START=clave-generada-para-http-start

# Tiempos de polling (ms)
AZURE_PIPELINE_TIMEOUT_MS=90000
AZURE_PIPELINE_POLL_MS=2000

# Base de datos (Prisma/PostgreSQL)
DATABASE_URL=postgresql://tfm:tfm@localhost:5432/tfm?schema=public
```

- Las variables de Azure se usan en `src/app/api/azure-analyze/route.ts` para solicitar SAS y disparar el pipeline.
- `DATABASE_URL` permite a Prisma generar el cliente y sincronizar el esquema con `pnpm prisma:push`.

> **Importante:** la ruta `/api/azure-analyze` exige un payload `expected` serializado en JSON y fallará con estado `400` si falta.

---

## Flujo funcional principal

1. **Configuración**: el operador selecciona lote, vencimiento y orden esperados a partir de datos provistos por `/api/expected`. (`src/components/ExpectedData.tsx`)
2. **Selección de imagen**: se elige origen (archivo o cámara) y la imagen se compacta automáticamente antes de almacenarse en el estado global, generando una vista previa. (`src/components/uploader/*`)
3. **Envío a Azure**: el botón `Procesar` empaqueta la imagen y los valores esperados, resetea estados previos y realiza la petición `POST /api/azure-analyze`. (`src/components/uploader/SendToAzureButton.tsx`)
4. **Pipeline y polling**: la API de Next.js sube el blob, inicia el pipeline y espera la finalización para obtener resultados, overlays y datos de validación. (`src/app/api/azure-analyze/route.ts`)
5. **Presentación de resultados**: se renderizan secciones con texto OCR, estado del código de barras, accesos a imágenes resultantes y un panel de validación que resume el cumplimiento de cada control. (`src/components/processing/*`)
6. **Métricas agregadas**: cada ejecución incrementa contadores de inspecciones totales, aprobadas y rechazadas mostrados en la sección de estado. (`src/components/StatusSummary.tsx` + `src/lib/store.ts`)

---

## API y datos mock

- Durante el desarrollo, el archivo `next.config.ts` reescribe todas las peticiones `GET /api/*` hacia `http://localhost:4000/*`, donde `json-server` sirve los datos definidos en `mocks/db.json` y rutas en `mocks/routes.json`.
- Si `json-server` no está disponible, Next.js atiende `GET /api/expected` con el mismo payload que los mocks, permitiendo que la UI funcione offline. (`src/app/api/expected/route.ts`)
- Para extender la API (por ejemplo, guardar historiales), se recomienda crear nuevas rutas en `src/app/api/*` reutilizando el cliente Prisma de `src/server/prisma.ts`.

---

## Base de datos y Prisma

1. Asegurar que Docker esté en ejecución y lanzar PostgreSQL:
   ```bash
   pnpm docker:up
   ```
2. Empujar el esquema Prisma:
   ```bash
   pnpm prisma:push
   ```
3. Generar el cliente TypeScript:
   ```bash
   pnpm prisma:generate
   ```
4. (Opcional) Abrir Prisma Studio:
   ```bash
   pnpm prisma:studio
   ```

El esquema (`prisma/schema.prisma`) define:
- `Processing`: registros de ejecuciones con metadatos, resultado y vínculo a blobs.
- `ROI`: regiones de interés detectadas por el pipeline (lote, código de barras, etc.).

---

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `pnpm dev` | Orquesta base de datos, mocks y Next.js en modo desarrollo.
| `pnpm dev:next` | Inicia únicamente la aplicación Next.js con Turbopack.
| `pnpm dev:mock` | Levanta `json-server` sirviendo `mocks/db.json`.
| `pnpm docker:up` / `pnpm docker:down` | Inicia o detiene PostgreSQL vía Docker Compose.
| `pnpm prisma:push` | Sincroniza el esquema Prisma con la base de datos.
| `pnpm prisma:generate` | Regenera el cliente Prisma.
| `pnpm prisma:studio` | Abre Prisma Studio para inspección visual.
| `pnpm build` | Genera la build de producción (`next build --turbopack`).
| `pnpm start` | Sirve la build generada.
| `pnpm lint` | Ejecuta ESLint con la configuración de Next.js.

---

## Estructura del proyecto

```
.
├── src
│   ├── app
│   │   ├── layout.tsx          # Layout global (cabecera, pie, skeleton, tema)
│   │   ├── page.tsx            # Tabs de Configuración y Procesamiento
│   │   └── api                 # Rutas Next.js API (Azure, expected)
│   ├── components              # Componentes de UI y layout (uploader, procesamiento, etc.)
│   ├── lib                     # Estado global, utilidades de OCR/imagen
│   ├── server                  # Helpers server-only (Azure, Prisma)
│   └── styles                  # Tailwind & variables globales
├── prisma                      # Esquema y migraciones
├── mocks                       # Datos mock para json-server
├── docker                      # Docker Compose para PostgreSQL
├── public                      # Recursos estáticos (favicon, logo)
└── package.json                # Scripts y dependencias
```

---

## Calidad y buenas prácticas

- **TypeScript estricto** con paths alias `@/*` definidos en `tsconfig.json`.
- **ESLint** con reglas de `next/core-web-vitals` (`eslint.config.mjs`). Ejecutar `pnpm lint` antes de subir cambios.
- **Persistencia segura**: el store revoca URLs de objetos anteriores para evitar fugas en memoria (`src/lib/store.ts`).
- **Hidratación controlada**: `HydrationGate` asegura que los datos persistidos estén listos antes de renderizar el árbol de componentes (`src/components/HydrationGate.tsx`).
- **Accesibilidad**: componentes con etiquetas, estados deshabilitados, tooltips informativos y soporte para teclado en tabs y selects.

---

## Despliegue

1. Construir la aplicación:
   ```bash
   pnpm build
   ```
2. Configurar las mismas variables de entorno de Azure y base de datos en la plataforma destino.
3. Servir la build:
   ```bash
   pnpm start
   ```
4. Si se despliega en plataformas serverless, asegurar conectividad entre las rutas API de Next.js y las Functions / base de datos correspondientes.

---

## Resolución de problemas comunes

- **Fallo al obtener SAS**: verificar `AZURE_FUNC_HOST` y claves (`AZURE_FUNC_KEY_*`). El backend responde 502 si Azure devuelve error. Revisar logs en `src/app/api/azure-analyze/route.ts`.
- **Pipeline sin respuesta**: ajustar `AZURE_PIPELINE_TIMEOUT_MS` o `AZURE_PIPELINE_POLL_MS` si el procesamiento es más lento que los valores por defecto.
- **Imagen no se actualiza**: la compresión genera un nuevo Object URL y revoca el previo. Si se reusa el archivo original, forzar recarga o limpiar caché del navegador.
- **Mocks no disponibles**: iniciar `pnpm dev:mock` o eliminar la reescritura temporalmente; de lo contrario `GET /api/expected` servirá sólo el mock por defecto.

---

## Próximos pasos sugeridos

- Persistir historiales de inspección utilizando Prisma y exponerlos en una vista adicional.
- Añadir autenticación e integración con directorio corporativo si el despliegue lo requiere.
- Automatizar pruebas de regresión visual y unitarias para componentes críticos.

---

Si necesitas ampliar el alcance funcional o integrar nuevos servicios, consulta primero la arquitectura descrita anteriormente para mantener la coherencia del sistema.
