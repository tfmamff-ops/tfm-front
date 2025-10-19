# TFM Frontend

## Tabla de contenidos
- [Visión general](#visión-general)
- [Arquitectura y stack](#arquitectura-y-stack)
- [Requisitos previos](#requisitos-previos)
- [Configuración inicial](#configuración-inicial)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución en local](#ejecución-en-local)
- [API simulada y datos mock](#api-simulada-y-datos-mock)
- [Base de datos y Prisma](#base-de-datos-y-prisma)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo funcional principal](#flujo-funcional-principal)
- [Buenas prácticas y calidad](#buenas-prácticas-y-calidad)
- [Despliegue](#despliegue)
- [Recursos adicionales](#recursos-adicionales)

## Visión general
Aplicación frontend construida con Next.js para asistir en la inspección y validación de etiquetas en una línea de producción. El operador puede configurar los valores esperados (lote, vencimiento y orden), cargar o capturar imágenes y enviar el material a un pipeline de Azure Functions que realiza OCR, validación y verificación de códigos de barras. La interfaz resume los resultados, muestra overlays generados por la automatización y consolida métricas de control.

## Arquitectura y stack
- **Framework**: Next.js 15 (App Router) con React 19 y TypeScript.
- **UI**: Tailwind CSS 4, componentes de shadcn/ui y Radix UI.
- **Estado**: Zustand con persistencia en `sessionStorage` para conservar configuración durante la sesión.
- **Backend serverless**: Rutas API de Next.js que actúan como proxy frente a Azure Functions (SAS, pipeline de procesamiento).
- **Persistencia**: Prisma Client apuntando a PostgreSQL para almacenar historiales de procesamiento.
- **Mocking**: json-server sirve datos mock durante el desarrollo.
- **Infraestructura local**: Docker Compose provisiona PostgreSQL.

## Requisitos previos
1. **Node.js** ≥ 18.18 y **pnpm** ≥ 9 (`corepack enable` recomendado).
2. **Docker Desktop** o un runtime compatible para levantar la base de datos local.
3. Credenciales de Azure Functions habilitadas para solicitar SAS y disparar el pipeline.
4. (Opcional) Cliente SQL o Prisma Studio para inspeccionar la base de datos.

## Configuración inicial
1. Instale dependencias:
   ```bash
   pnpm install
   ```
2. Cree un archivo `.env.local` en la raíz con las variables descritas en la siguiente sección.
3. Si se ejecuta por primera vez, levante los contenedores y empuje el esquema con Prisma (ver secciones siguientes).

## Variables de entorno
Las rutas API que interactúan con Azure requieren claves y host del Function App. Ejemplo de `.env.local`:
```bash
# Host del Azure Function App (sin protocolo)
AZURE_FUNC_HOST=mi-funcion.azurewebsites.net

# Funciones http trigger: obtener SAS y lanzar pipeline
AZURE_FUNC_KEY_GET_SAS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_FUNC_KEY_HTTP_START=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# Ajustes opcionales (ms)
AZURE_PIPELINE_TIMEOUT_MS=90000
AZURE_PIPELINE_POLL_MS=2000

# Base de datos PostgreSQL (usada por Prisma)
DATABASE_URL=postgresql://tfm:tfm@localhost:5432/tfm?schema=public
```
> Las variables de Azure se usan en `src/app/api/azure-analyze/route.ts`. Ajuste el host y las claves según el entorno de despliegue. `DATABASE_URL` es necesaria para generar el cliente de Prisma y ejecutar migraciones.

## Ejecución en local
El flujo recomendado es usar el script unificado que orquesta base de datos, json-server y Next.js:
```bash
pnpm dev
```
Este comando:
- Levanta PostgreSQL via Docker Compose (`pnpm docker:up`).
- Inicia la aplicación Next.js en `http://localhost:3000` (`pnpm dev:next`).
- Inicia el mock API en `http://localhost:4000` (`pnpm dev:mock`).

Para detener los servicios ejecute:
```bash
pnpm docker:down
```

### Ejecución granular
- **Aplicación Next.js**: `pnpm dev:next`
- **Mock API json-server**: `pnpm dev:mock`
- **Solo contenedor de base de datos**: `pnpm docker:up`

## API simulada y datos mock
- Durante el desarrollo, todas las peticiones a `/api/*` se reescriben hacia json-server (`next.config.ts`).
- Los datos mock residen en `mocks/db.json`, con rutas definidas en `mocks/routes.json`.
- Si json-server no está disponible, la ruta `src/app/api/expected/route.ts` actúa como fallback y expone el mismo payload que el mock para `expected`.

## Base de datos y Prisma
1. Levantar PostgreSQL:
   ```bash
   pnpm docker:up
   ```
2. Empujar el esquema al contenedor (crea tablas si no existen):
   ```bash
   pnpm prisma:push
   ```
3. Generar el cliente de Prisma para TypeScript:
   ```bash
   pnpm prisma:generate
   ```
4. (Opcional) Abrir Prisma Studio para explorar registros:
   ```bash
   pnpm prisma:studio
   ```

El esquema se encuentra en `prisma/schema.prisma` e incluye los modelos `Processing` y `ROI` para registrar resultados y regiones de interés identificadas.

## Scripts disponibles
| Script | Descripción |
| --- | --- |
| `pnpm dev` | Arranca la base de datos, json-server y la aplicación Next.js en modo desarrollo. |
| `pnpm dev:next` | Ejecuta únicamente Next.js con Turbopack. |
| `pnpm dev:mock` | Levanta json-server con mocks y rutas custom. |
| `pnpm docker:up` / `pnpm docker:down` | Inicia o detiene el contenedor de PostgreSQL definido en `docker/docker-compose.yml`. |
| `pnpm prisma:push` | Sincroniza el esquema Prisma con la base de datos. |
| `pnpm prisma:generate` | Genera el cliente de Prisma actualizado. |
| `pnpm prisma:studio` | Abre Prisma Studio en el navegador. |
| `pnpm build` | Genera el artefacto de producción usando Turbopack. |
| `pnpm start` | Sirve la build de producción. |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto. |

## Estructura del proyecto
```
.
├── src
│   ├── app
│   │   ├── page.tsx               # UI principal (tabs de Configuración y Procesamiento)
│   │   └── api                    # Rutas API (Azure, expected, etc.)
│   ├── components                 # Componentes reutilizables (layout, uploader, UI)
│   ├── lib                        # Estado global (Zustand) y utilidades
│   ├── server                     # Código server-only (Azure helpers, Prisma)
│   └── styles                     # Estilos globales
├── prisma                         # Esquema de base de datos
├── mocks                          # Datos mock y configuración de json-server
├── docker/docker-compose.yml      # Servicios locales (PostgreSQL)
├── doc                            # Documentación y mockups de diseño
└── README.md
```

## Flujo funcional principal
1. **Configuración**: el usuario selecciona lote, vencimiento y orden esperados (`ExpectedData`, `ConfiguredValues`).
2. **Ingesta de imagen**: puede subir un archivo o usar cámara (`ImageSourcePanel`). Se genera una vista previa persistida en el store global.
3. **Procesamiento**: el componente `SendToAzureButton` envía la imagen y los valores esperados a `/api/azure-analyze`.
4. **Pipeline Azure**: la ruta API solicita SAS de subida/lectura, sube la imagen a Blob Storage, lanza el pipeline y espera el resultado (`src/app/api/azure-analyze/route.ts`).
5. **Resultados**: se actualiza el estado global con URLs temporales, datos OCR, validaciones de código de barras y métricas (`ProcessingCard`, `StatusSummary`).
6. **Persistencia**: los modelos Prisma (`Processing`, `ROI`) permiten registrar historiales en PostgreSQL si se implementan acciones server-side adicionales.

## Buenas prácticas y calidad
- El store global (`src/lib/store.ts`) aplica `persist` de Zustand sobre `sessionStorage`, revocando URLs para evitar fugas de memoria.
- Preferir componentes de `src/components/ui` para mantener consistencia visual.
- Ejecutar `pnpm lint` antes de crear commits para garantizar estilo y reglas de calidad.
- Mantener documentación de diseños actualizada en `doc/` (incluye mockups e imágenes de referencia).

## Despliegue
1. Construir la aplicación:
   ```bash
   pnpm build
   ```
2. Definir las variables de entorno necesarias en la plataforma objetivo (Azure Function host y claves, `DATABASE_URL` si aplica).
3. Iniciar el servidor:
   ```bash
   pnpm start
   ```
4. Para entornos serverless/edge, asegúrese de que las rutas API tengan acceso a las funciones de Azure y a la base de datos.

## Recursos adicionales
- [Documentación oficial de Next.js](https://nextjs.org/docs)
- [Guía de shadcn/ui](https://ui.shadcn.com/)
- [Prisma ORM](https://www.prisma.io/docs)
- [json-server](https://github.com/typicode/json-server)
- [Azure Functions durable workflows](https://learn.microsoft.com/azure/azure-functions/)
