# TFM Frontend

TFM Frontend es una aplicación web construida con Next.js 15 y React 19 que sirve como consola de operación para digitalizar la inspección de líneas de envasado farmacéutico. El operador selecciona la referencia esperada desde el ERP, captura o carga fotografías de las unidades inspeccionadas y dispara un pipeline de análisis en Azure que devuelve las lecturas de OCR, estado de los códigos de barras y validaciones automáticas. La interfaz está optimizada para uso en planta, con componentes responsivos, estados claros y persistencia del contexto del usuario.

## Características principales

- **Experiencia guiada de inspección**: pestañas separadas para configuración y procesamiento, con ayudas contextualizadas y validación de estados antes de avanzar. 【F:src/app/page.tsx†L16-L79】
- **Selección de datos esperados desde ERP**: consumo de un CSV alojado en Azure Blob Storage para poblar un selector de medicamento y visualizar el detalle de lote, orden y caducidad. 【F:src/app/api/expected/route.ts†L5-L53】【F:src/components/ExpectedData.tsx†L17-L116】
- **Ingreso flexible de imágenes**: soporte tanto para carga de archivos como para captura desde cámara, generando previsualizaciones inmediatas para el operador. 【F:src/components/uploader/ImageSourcePanel.tsx†L1-L47】
- **Orquestación con Azure Functions**: la API `/api/azure-analyze` sube la imagen a Blob Storage mediante SAS, inicia el pipeline duradero y expone enlaces temporales a las imágenes resultantes y resúmenes de OCR/validación. 【F:src/app/api/azure-analyze/route.ts†L1-L209】
- **Panel de resultados en vivo**: secciones dedicadas a OCR, códigos de barras, imágenes del proceso y estado de las validaciones, alimentadas por un store global con Zustand. 【F:src/components/processing/OcrSection.tsx†L1-L29】【F:src/components/processing/ProcessImagesSection.tsx†L1-L92】
- **Persistencia y trazabilidad**: el contexto del usuario se guarda en `sessionStorage` para incluirlo en las peticiones y facilitar auditorías. 【F:src/lib/auth-store.ts†L8-L114】

## Arquitectura

La solución sigue la arquitectura de App Router de Next.js, con componentes de React Server y Client según corresponda:

- `src/app`: páginas y rutas API de Next.js. Las rutas API actúan como orquestadores entre la interfaz y los servicios de Azure o el backend. 【F:src/app/api/azure-analyze/route.ts†L1-L209】【F:src/app/api/expected/route.ts†L1-L53】
- `src/components`: UI reutilizable organizada por dominios (layout, processing, uploader) y utilidades de diseño basadas en Radix UI, Tailwind CSS 4 y Lucide Icons. 【F:src/components/layout/Configuration.tsx†L1-L30】
- `src/lib`: stores Zustand para estado de aplicación y autenticación, más helpers compartidos. 【F:src/lib/store.ts†L1-L214】
- `src/server`: funciones server-only para acceso a Azure Functions y a la base de datos vía Prisma. 【F:src/server/azure.ts†L1-L134】
- `prisma`: esquema de la base de datos y generación del cliente ORM. 【F:prisma/schema.prisma†L1-L36】

El estado global vive en `src/lib/store.ts` y controla la selección de ERP, archivos, contadores, resultados de OCR/barcode y validaciones, asegurando un reseteo coherente entre inspecciones. 【F:src/lib/store.ts†L64-L214】

## Requisitos previos

- Node.js >= 20 y pnpm >= 9.
- Docker Desktop para levantar PostgreSQL local (usado por Prisma) y opcionalmente otros servicios.
- Cuenta y funciones en Azure con endpoints SAS para los contenedores `input`, `output` y `erp`.

## Variables de entorno

Crea un archivo `.env.local` en la raíz con las siguientes claves:

```dotenv
# Azure Functions
AZURE_FUNC_HOST=xxxx.azurewebsites.net
AZURE_FUNC_KEY_GET_SAS=...
AZURE_FUNC_KEY_HTTP_START=...
AZURE_PIPELINE_TIMEOUT_MS=90000        # opcional
AZURE_PIPELINE_POLL_MS=2000            # opcional

# Base de datos Prisma
DATABASE_URL=postgresql://tfm:tfm@localhost:5432/tfm?schema=public
```

Las claves de Azure se usan para generar SAS de lectura/escritura y arrancar el pipeline de análisis. El `DATABASE_URL` alimenta al cliente Prisma definido en `prisma/schema.prisma`. 【F:prisma/schema.prisma†L1-L21】

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Levantar la base de datos local y los servicios de desarrollo:
   ```bash
   pnpm dev
   ```
   Este comando ejecuta `docker compose up` para PostgreSQL y arranca en paralelo el front (`pnpm dev:next`) y el mock de APIs (`pnpm dev:mock`) con JSON Server. 【F:package.json†L6-L15】
3. Acceder a `http://localhost:3000`. Las peticiones a `/api/expected` y `/api/azure-analyze` se redirigen al mock cuando no se cuenta con infraestructura Azure.

> Para apagar la infraestructura auxiliar, usa `pnpm docker:down`. 【F:package.json†L10-L12】

## Uso en desarrollo sin Azure

El mock definido en [`mocks/db.json`](./mocks/db.json) y [`mocks/routes.json`](./mocks/routes.json) permite simular respuestas del ERP y del pipeline, facilitando pruebas de la interfaz. Ajusta esos archivos para cubrir distintos escenarios de OCR o validaciones. 【F:mocks/db.json†L1-L160】【F:mocks/routes.json†L1-L3】

## Operaciones con Prisma

- Sincronizar el esquema con la base de datos: `pnpm prisma:push`
- Abrir Prisma Studio para inspeccionar datos: `pnpm prisma:studio`
- Generar el cliente tras modificar `schema.prisma`: `pnpm prisma:generate`

El cliente se expone desde [`src/server/prisma.ts`](./src/server/prisma.ts) con protección para hot-reload en desarrollo. 【F:src/server/prisma.ts†L1-L24】

## Scripts disponibles

| Script                | Descripción |
| --------------------- | ----------- |
| `pnpm dev:next`       | Arranca Next.js con Turbopack en modo desarrollo. 【F:package.json†L6-L7】 |
| `pnpm dev:mock`       | Inicia JSON Server con las rutas simuladas. 【F:package.json†L6-L9】 |
| `pnpm dev`            | Ejecuta Docker Compose y ambos procesos anteriores en paralelo. 【F:package.json†L8-L12】 |
| `pnpm build`          | Compila la aplicación con Turbopack. 【F:package.json†L14-L15】 |
| `pnpm start`          | Levanta Next.js en modo producción tras `build`. 【F:package.json†L15-L16】 |
| `pnpm lint`           | Ejecuta ESLint con la configuración del proyecto. 【F:package.json†L16-L17】 |

## Estructura de carpetas destacada

```
.
├── src
│   ├── app               # App Router y rutas API
│   ├── components        # Componentes de UI y dominio
│   ├── lib               # Stores y utilidades compartidas
│   ├── server            # Integraciones server-side (Azure, Prisma)
│   └── styles            # Estilos globales y tokens Tailwind
├── mocks                 # Endpoints simulados con JSON Server
├── prisma                # Esquema y cliente de base de datos
└── docker                # Definiciones de infraestructura local
```

## Flujo funcional

1. **Configuración inicial**: el operador selecciona un medicamento desde el ERP; el detalle se refleja en `ConfiguredData` y desbloquea la pestaña de procesamiento. 【F:src/components/ConfiguredData.tsx†L1-L27】
2. **Captura/carga**: mediante `ImageUploader` o `CameraCapture` se obtiene la imagen y se genera la previsualización. El store guarda el origen y el archivo asociado. 【F:src/components/uploader/ImageUploader.tsx†L1-L100】
3. **Envío a Azure**: `SendToAzureButton` compone un `FormData` con la imagen, los valores esperados y el contexto de usuario, y lo envía a `/api/azure-analyze`. 【F:src/components/uploader/SendToAzureButton.tsx†L1-L156】
4. **Pipeline duradero**: la API gestiona la subida a Blob Storage, inicia la función orquestadora y realiza polling hasta recibir resultados o timeout. 【F:src/app/api/azure-analyze/route.ts†L61-L209】
5. **Visualización**: los componentes de `src/components/processing` muestran enlaces a las imágenes procesadas, listados OCR, estado del código de barras y un resumen de validaciones. 【F:src/components/processing/ValidationSection.tsx†L1-L181】
6. **Persistencia**: los contadores y validaciones se resetean al comenzar una nueva inspección, evitando datos cruzados. 【F:src/lib/store.ts†L214-L472】

## Calidad y estilo

- ESLint con la configuración de Next.js 15 asegura el cumplimiento de buenas prácticas en React y TypeScript. 【F:eslint.config.mjs†L1-L25】
- Tailwind CSS 4 y utilidades como `class-variance-authority` ayudan a crear componentes consistentes y accesibles.
- Zustand se usa con `devtools` y `persist` únicamente en desarrollo, evitando impactos en producción. 【F:src/lib/store.ts†L222-L250】

## Despliegue

1. Ejecuta `pnpm build` para generar la versión optimizada.
2. Publica la carpeta `.next` en la plataforma de tu elección (Vercel, Azure Static Web Apps, etc.).
3. Proporciona las variables de entorno de Azure y la cadena de conexión a base de datos (si aplica). El pipeline depende de Azure Functions alcanzables desde el entorno de producción.

## Próximos pasos sugeridos

- Integrar autenticación real y obtención automática del `RequestContext` desde el backend corporativo.
- Persistir los resultados del pipeline en la base de datos PostgreSQL para análisis histórico y dashboards.
- Añadir pruebas end-to-end con Playwright que cubran el flujo completo con mocks.

---

Este README resume la arquitectura y los pasos necesarios para ejecutar y extender el frontend del proyecto TFM, facilitando la incorporación de nuevos contribuidores y la operación diaria en planta.
