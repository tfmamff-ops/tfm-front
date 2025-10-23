# Rotulado – Verificación Automática de Rotulado

## Introducción
Rotulado es una aplicación web construida con Next.js 15 y TypeScript que permite a los operarios de una línea de producción verificar automáticamente la información impresa en envases. El sistema centraliza la selección de parámetros esperados, la carga o captura de imágenes y el envío del material a un pipeline de Visión Artificial y OCR desplegado en Azure Functions. La interfaz ofrece retroalimentación inmediata sobre el estado del proceso, los resultados de lectura y los indicadores de control de calidad.

## Características clave
- **Interfaz moderna** basada en App Router de Next.js, Tailwind CSS 4 y componentes derivados de Radix UI.
- **Gestión de estado global** con Zustand persistido en `sessionStorage`, lo que mantiene selecciones y contadores entre recargas controladas.
- **Ingreso flexible de imágenes**: subida de archivos con compresión automática o captura directa desde la cámara del dispositivo.
- **Integración con Azure** para orquestar un pipeline que genera overlays de OCR, información de códigos de barras y validaciones automáticas.
- **Datos simulados en desarrollo** mediante `json-server`, con la misma API que se usará en producción.
- **Base de datos preparada** con Prisma y Postgres para almacenar historiales de procesamiento cuando se requiera.

## Arquitectura general
| Capa | Descripción |
| --- | --- |
| Interfaz | Componentes React client-side para configuración, previsualización, procesamiento y resumen (`src/components`). |
| Estado | Store centralizado en `src/lib/store.ts` con slices para imágenes, datos esperados, OCR, códigos de barras y validaciones. |
| API interna | Rutas App Router (`src/app/api`) que proxyan datos esperados y gestionan el flujo completo con Azure Functions. |
| Servicios auxiliares | Utilidades server-only para SAS, subida a Blob Storage y polling del pipeline (`src/server/azure.ts`). |
| Datos | Prisma schema (`prisma/schema.prisma`) y Docker Compose con Postgres para persistencia futura. |

## Requisitos previos
- Node.js >= 18.18 (recomendado 20).
- PNPM >= 9.
- Docker Desktop (para la base de datos Postgres de desarrollo).
- Cuenta de Azure con Azure Functions configuradas para exponer operaciones de SAS y procesamiento.

## Configuración del entorno
1. **Instalar dependencias**
   ```bash
   pnpm install
   ```
2. **Variables de entorno**
   Cree un archivo `.env.local` con las siguientes claves:
   ```bash
   AZURE_FUNC_HOST=mi-funcion.azurewebsites.net
   AZURE_FUNC_KEY_GET_SAS=clave-generada-para-sas
   AZURE_FUNC_KEY_HTTP_START=clave-generada-para-http-start
   AZURE_PIPELINE_TIMEOUT_MS=90000      # opcional, milisegundos
   AZURE_PIPELINE_POLL_MS=2000          # opcional, milisegundos
   DATABASE_URL=postgresql://tfm:tfm@localhost:5432/tfm
   ```
   - Las claves `AZURE_FUNC_*` deben corresponder a las funciones `sas` y `process` expuestas por Azure.
   - `DATABASE_URL` se usa para Prisma/Postgres; ajuste el host/puerto si ejecuta la base de datos en otra ubicación.

## Ejecución en desarrollo
```bash
pnpm dev
```
El script levanta Postgres mediante Docker (`docker/docker-compose.yml`) y, en paralelo, ejecuta:
- `pnpm dev:next`: servidor Next.js con Turbopack en `http://localhost:3000`.
- `pnpm dev:mock`: `json-server` en `http://localhost:4000` que sirve `mocks/db.json`.

Para detener los contenedores:
```bash
pnpm docker:down
```

## Comandos disponibles
| Comando | Descripción |
| --- | --- |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto. |
| `pnpm build` | Genera el build de producción con Turbopack. |
| `pnpm start` | Sirve el build generado en modo producción. |
| `pnpm prisma:generate` | Crea el cliente Prisma a partir del schema. |
| `pnpm prisma:push` | Sincroniza el schema con la base de datos. |
| `pnpm prisma:studio` | Abre Prisma Studio para inspeccionar datos. |

## Flujo funcional
1. **Selección de datos esperados**: `ExpectedData` consume `/api/expected` para poblar listas de lote, vencimiento y orden. Los datos se almacenan en el store global y definen la línea de producción activa.
2. **Fuente de imagen**: `ImageSourcePanel` permite alternar entre subida de archivo (`ImageUploader`) y captura con cámara (`CameraCapture`). Ambos caminos comprimen la imagen en el navegador mediante `compressImageFile` antes de enviarla.
3. **Previsualización**: el componente `Preview` muestra la imagen seleccionada junto con la procedencia (archivo o cámara). Cambiar la imagen restablece OCR, códigos de barras y validaciones vigentes.
4. **Procesamiento**: `SendToAzureButton` construye un `FormData` con la imagen y los datos esperados, solicita una SAS de subida, carga el archivo a Azure Blob Storage, inicia el pipeline y hace polling hasta recibir el resultado.
5. **Resultados**: `ProcessingCard` agrupa las secciones de OCR, código de barras, enlaces a imágenes procesadas y validación. Los contadores globales (`StatusSummary`) se incrementan según el resultado final.

## Integración con Azure Functions
- La ruta `src/app/api/azure-analyze/route.ts` encapsula todo el flujo: lectura del archivo, solicitud de SAS, subida, inicio del pipeline, polling y obtención de nuevas SAS de lectura para los artefactos generados.
- `src/server/azure.ts` centraliza las llamadas a Azure (`getSasUrlForRead`, `getSasUrlForUpload`, `startPipeline`, `pollPipeline`).
- El pipeline debe responder con referencias a blobs de salida, resultados de OCR, datos de códigos de barras y una sección de validación. La interfaz muestra cualquier error HTTP devolviendo mensajes amigables.

## Estado global y gestión de imágenes
- El store (`src/lib/store.ts`) define slices para la fuente de imagen, archivo, previsualización, datos esperados, contadores, OCR, códigos de barras, validación y URLs de imágenes procesadas. El estado se persiste con `zustand/middleware` usando `sessionStorage`.
- `HydrationGate` se asegura de que la interfaz espere a que el estado persistido se hidrate antes de renderizar componentes client-side.
- Cada vez que se reemplaza la previsualización, se revocan los `ObjectURL` anteriores para evitar fugas de memoria y se limpian los resultados previos.

## Datos de prueba y mocks
- `mocks/db.json` contiene listas representativas de lotes, órdenes y vencimientos. Puede modificarse para simular otras líneas de producción.
- `next.config.ts` redirige `/api/*` a `json-server` durante el desarrollo, por lo que la aplicación funciona igual con mocks o con la API real.

## Esquema de base de datos
El archivo `prisma/schema.prisma` define dos modelos:
- `Processing`: registros de ejecuciones con timestamps, estado y URL de imagen.
- `ROI`: detalla regiones de interés detectadas (lote, vencimiento, orden, código de barras) y su validez.

Al ejecutar `pnpm prisma:push` con la base de datos de Docker se crean las tablas iniciales listas para ser consumidas por futuras funcionalidades (p. ej. histórico o auditoría).

## Estructura principal del proyecto
```
.
├─ src
│  ├─ app/                 # Rutas App Router y layout global
│  ├─ components/          # UI modular (layout, uploader, processing, etc.)
│  ├─ lib/                 # Store, utilidades de imagen y OCR
│  ├─ server/              # Código server-only para Azure y Prisma
│  └─ styles/              # Tailwind y temas globales
├─ mocks/db.json           # Fuente de datos mock para json-server
├─ prisma/schema.prisma    # Definición de la base de datos
├─ docker/docker-compose.yml # Postgres de desarrollo
└─ public/logo.svg         # Identidad visual
```

## Estándares y herramientas
- ESLint (configuración `next/core-web-vitals` + TypeScript) para calidad de código.
- Tailwind CSS 4 con variantes personalizadas y animaciones (`tw-animate-css`).
- Iconografía a través de `lucide-react` y patrones accesibles inspirados en shadcn/ui.

## Despliegue
1. Ajuste las variables de entorno en la plataforma de despliegue (Azure Static Web Apps, Vercel, Netlify, etc.).
2. Ejecute `pnpm build` para generar el bundle optimizado.
3. Sirva la aplicación con `pnpm start` o el adaptador correspondiente.
4. Asegúrese de que las funciones de Azure y el almacenamiento de blobs estén accesibles desde el dominio final.

---
Para dudas o mejoras, revise los componentes en `src/components` y el store central en `src/lib/store.ts`, donde reside la lógica principal del flujo de procesamiento.
