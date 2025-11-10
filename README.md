# Rotulado – Verificación automática de rotulado

Este repositorio contiene la interfaz web del proyecto **Rotulado**, una aplicación de visión artificial orientada al control de calidad farmacéutico. El operador puede seleccionar los datos esperados desde el ERP, capturar o subir una fotografía del empaque y enviar el material a un pipeline en Azure Functions que realiza OCR, detección de códigos de barras y validaciones automáticas. El objetivo principal es acelerar la inspección de lotes y reducir errores manuales.

## Características principales

* **Experiencia guiada en dos pasos**: pestañas de *Configuración* y *Procesamiento* que ordenan el flujo operativo y bloquean acciones cuando faltan datos obligatorios.
* **Integración con ERP**: lectura de un CSV alojado en Azure Blob Storage para poblar el selector de productos y completar automáticamente lote, vencimiento y fecha de envasado.
* **Múltiples fuentes de imagen**: subida de archivos JPG/PNG o captura directa desde la cámara del navegador con compresión previa para optimizar el envío.
* **Previsualización y seguimiento**: paneles laterales reutilizables que muestran los datos configurados, la miniatura de la imagen actual y contadores de inspecciones OK/Rechazo.
* **Orquestación en Azure**: la UI invoca un endpoint Next.js que solicita URLs SAS, sube la imagen al contenedor de entrada, dispara la Durable Function y espera el resultado final.
* **Resultados enriquecidos**: despliegue de texto OCR, estado del código de barras, overlays generados por el backend y resumen de validaciones para una rápida toma de decisiones.
* **Persistencia preparada**: esquema Prisma listo para almacenar historiales de procesamiento y regiones de interés en una base PostgreSQL.
* **Conexión automática con ERP**: las variables `ERP_CONTAINER` y `BLOB_ERP_QUAD` determinan el contenedor y archivo CSV donde se alojan los datos exportados del ERP para la carga automática de productos y lotes.

## Arquitectura

* **Framework**: Next.js 15 con el *App Router*, React 19 y soporte server/client components.
* **Estado global**: Zustand con middleware de persistencia y *devtools* separados para el contexto de autenticación y el estado operativo de la inspección.
* **UI**: Tailwind CSS 4, componentes Radix UI (tabs, selects, hover cards) y librerías auxiliares como `lucide-react`, `react-webcam` y `sonner`.
* **Capa de servidor**: rutas API en `/app/api` para comunicarse con Azure Functions y normalizar las respuestas del pipeline; utilidades server-only en `src/server/`.
* **Datos**: Prisma Client como ORM (modelo `Processing` + `ROI`) y mocks locales vía `json-server` para el endpoint `/api/expectedData` cuando no se dispone del entorno de nube.
* **ERP remoto**: lectura del archivo `BLOB_ERP_QUAD` en el contenedor `ERP_CONTAINER` dentro de Azure Blob Storage.

## Flujo funcional

1. La vista de Configuración descarga el CSV del ERP (definido por `ERP_CONTAINER` y `BLOB_ERP_QUAD`) y permite seleccionar un producto para completar los valores esperados.
2. El operador adjunta una imagen o toma una captura; la aplicación genera una URL de previsualización y almacena metadatos en el store.
3. Al presionar **Procesar**, se construye un `FormData` con la imagen, los datos esperados y el contexto del usuario.
4. El endpoint `/api/azure-analyze` solicita una SAS de carga, sube el archivo, inicia la Durable Function y comienza a consultar su estado.
5. Una vez completado el pipeline, la API devuelve enlaces temporales a las imágenes procesadas, el resultado OCR, el estado del código de barras y las validaciones.
6. El store actualiza contadores, presenta los overlays y muestra mensajes de error en caso de fallos en cualquier etapa.

## Autenticación (Azure AD B2C + NextAuth)

Todas las páginas y rutas `/api` requieren sesión. El inicio de sesión es automático y el cierre limpia el contexto sin parpadeos visibles.

### Flujo resumido

1. Visitante llega a `/` sin cookie de sesión.
2. El `middleware` (`src/middleware.ts`) redirige a `/signin` adjuntando `callbackUrl`.
3. `/signin` dispara `signIn("azure-ad-b2c", { callbackUrl: "/" })`.
4. Azure AD B2C autentica y redirige al callback NextAuth (`/api/auth/callback/azure-ad-b2c`).
5. NextAuth crea JWT + cookie y devuelve al `callbackUrl`.
6. `AuthBootstrap` transforma la sesión en `requestContext` (ver `sessionToRequestContext`).
7. Endpoints internos (ej. `/api/azure-analyze`) validan sesión otra vez con `getServerSession(authOptions)`.

### Mapeo y normalización

Proveedor B2C (`profile`):

* Extrae `email` desde `emails[0]` o `email`.
* Construye `name` usando `name` o `given_name + family_name`.
* Usa `sub` como `user.id`.
* `jobTitle` → role simplificado (`qa operator` → `qa_operator`).

Callbacks `jwt` / `session`:

* Guardan `role` normalizado.
* Inyectan la IP del cliente (full) capturada por el middleware en `session.user.ip`.

### Helper de sesión

`sessionToRequestContext` (`src/lib/session-to-context.ts`):

```ts
user: { id, name, email?, role }
client: { appVersion, ip, userAgent }
```

### Captura de IP

El middleware añade cabecera y cookie `client-ip`; el callback la copia a la sesión. La IP puede ser la pública detrás de un proxy. Si se requiere anonimización, aplicar máscara antes de exponerla.

### Rutas públicas / allowlist

Se permiten sin sesión (para assets y flujo de login):
`/signin`, `/api/auth/*`, `/_next/*`, `/images/*`, `/public/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, y archivos estáticos que terminan en `.svg`, `.png`, `.jpg`.

### Logout

`signOut({ callbackUrl: "/api/auth/b2c-logout" })` dispara endpoint que delega en el flujo `end_session` de Azure AD B2C y retorna a `/signin`. Durante el proceso se muestra un overlay "Cerrando sesión…".

### Variables de autenticación (añadir a `.env`)

| Variable | Uso |
|---------|-----|
| `AZURE_AD_B2C_TENANT_NAME` | Tenant B2C (sin `.onmicrosoft.com`). |
| `AZURE_AD_B2C_CLIENT_ID` | ID de la aplicación registrada en B2C. |
| `AZURE_AD_B2C_CLIENT_SECRET` | Secreto del cliente (mantenerlo privado). |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | User Flow principal (ej. `B2C_1_signintfm`). |
| `NEXTAUTH_URL` | URL pública base del frontend (https completo). |
| `NEXTAUTH_SECRET` | Secreto para firmar JWT y estados; rotar periódicamente. |
| `NEXTAUTH_DEBUG` | (Opcional) `true` para log detallado en desarrollo. |

## Requisitos previos

* Node.js 20 o superior
* PNPM 9.x
* Docker (opcional) para levantar la base de datos PostgreSQL local

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Copiar `.env.example` a `.env` y definir las variables listadas en la sección de configuración.

3. Inicializar los servicios auxiliares y el entorno de desarrollo:

   ```bash
   pnpm dev
   ```

   Este comando levanta PostgreSQL mediante Docker Compose y, en paralelo, ejecuta Next.js con Turbopack y el servidor mock (`json-server`) que emula las respuestas del ERP.

4. Acceder a `http://localhost:3000`.

## Despliegue con Docker y Azure App Service

El frontend puede ejecutarse dentro de un contenedor Docker y desplegarse fácilmente en **Azure App Service**.

### Construcción local de la imagen

1. Verificar que el proyecto contenga los archivos `Dockerfile` y `.dockerignore` en la raíz.
2. Ejecutar:

   ```bash
   docker build -t rotulado-frontend .
   ```

### Ejecución local

Para probar la imagen localmente con las variables de entorno configuradas:

```bash
docker run --rm -p 3000:3000 --env-file .env rotulado-frontend
```

Para ejecutarlo en segundo plano (modo *detached*), usar:

```bash
docker run -d --rm -p 3000:3000 --env-file .env rotulado-frontend
```

El parámetro -d mantiene el contenedor activo sin bloquear la terminal.

Abrir [http://localhost:3000](http://localhost:3000).

### Publicación en Azure o Docker Hub

#### Opción 1 – Docker Hub

```bash
docker tag rotulado-frontend tu_usuario/rotulado-frontend:latest
docker push tu_usuario/rotulado-frontend:latest
```

#### Opción 2 – Azure Container Registry

```bash
az acr login --name <nombre_registry>
docker tag rotulado-frontend <nombre_registry>.azurecr.io/rotulado-frontend:latest
docker push <nombre_registry>.azurecr.io/rotulado-frontend:latest
```

### Configuración en Azure App Service

1. Crear un **App Service (Linux, Docker container)**.
2. En “Container settings”, indicar la imagen (de Docker Hub o ACR).
3. En **Configuration → Application Settings**, definir las variables de entorno:

   * `AZURE_FUNC_HOST`
   * `AZURE_FUNC_KEY_GET_SAS`
   * `AZURE_FUNC_KEY_HTTP_START`
   * `AZURE_PIPELINE_TIMEOUT_MS`
   * `AZURE_PIPELINE_POLL_MS`
   * `DATABASE_URL`
   * `ERP_CONTAINER`
   * `BLOB_ERP_QUAD`

Azure descargará la imagen, abrirá el puerto 3000 y ejecutará automáticamente el contenedor del frontend.

---

### Scripts disponibles

* `pnpm dev:next`: inicia Next.js en modo desarrollo sin dependencias externas.
* `pnpm dev:mock`: lanza únicamente el mock JSON en el puerto 4000.
* `pnpm dev`: orquesta Docker Compose y ambos procesos anteriores.
* `pnpm docker:up` / `pnpm docker:down`: control manual del contenedor PostgreSQL.
* `pnpm prisma:generate`, `pnpm prisma:push`, `pnpm prisma:studio`: tareas habituales de Prisma.
* `pnpm build`: compila la aplicación para producción.
* `pnpm start`: sirve la build generada.
* `pnpm lint`: ejecuta ESLint con la configuración de Next.js.

## Variables de entorno

Definir en `.env` todas las siguientes claves (agrupadas por función):

### Pipeline y Azure Functions

| Variable | Descripción |
|----------|-------------|
| `AZURE_FUNC_HOST` | Host de la Function App (sin `https://`). |
| `AZURE_FUNC_KEY_GET_SAS` | Key para generar SAS de lectura/escritura. |
| `AZURE_FUNC_KEY_HTTP_START` | Key para iniciar la Durable Function. |
| `AZURE_PIPELINE_TIMEOUT_MS` | (Opcional) Máximo tiempo de espera del pipeline. |
| `AZURE_PIPELINE_POLL_MS` | (Opcional) Intervalo entre sondeos de estado. |

### ERP / Datos configurados

| Variable | Descripción |
|----------|-------------|
| `ERP_CONTAINER` | Contenedor Blob donde vive el CSV exportado del ERP. |
| `BLOB_ERP_QUAD` | Nombre del archivo CSV con productos/lotes. |

### Base de datos (Prisma)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (uso futuro/reportes). |

### Autenticación

| Variable | Descripción |
|----------|-------------|
| `AZURE_AD_B2C_TENANT_NAME` | Tenant B2C. |
| `AZURE_AD_B2C_CLIENT_ID` | Client ID de la app B2C. |
| `AZURE_AD_B2C_CLIENT_SECRET` | Secreto del cliente B2C. |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | User Flow principal. |
| `NEXTAUTH_URL` | URL pública del frontend. |
| `NEXTAUTH_SECRET` | Secreto NextAuth (rotar). |
| `NEXTAUTH_DEBUG` | (Opcional) Activa logs debug. |

Para pruebas sin Azure se puede ejecutar solo el mock (`pnpm dev:mock`) y adaptar los componentes a datos locales.

## Estructura de carpetas

```txt
├── src
│   ├── app/                # App Router, layout raíz y rutas API
│   ├── components/         # Componentes UI (layout, uploader, procesamiento)
│   ├── lib/                # Stores, utilidades de payload/imagen/OCR
│   ├── server/             # Funciones server-only (Azure, Prisma)
│   └── styles/             # Estilos globales
├── prisma/                 # Esquema y migraciones del ORM
├── mocks/                  # JSON Server para datos ERP simulados
├── docker/                 # Docker Compose del entorno local
└── public/                 # Recursos estáticos (logo, iconos)
```

## Calidad y buenas prácticas

* El store principal (`useAppStore`) persiste selectivamente datos en `sessionStorage` y limpia Object URLs al cambiar la imagen.
* Lógica Azure centralizada en `src/server/azure.ts` para facilitar pruebas y sustituciones.
* `AuthBootstrap` + middleware garantizan que el usuario siempre esté autenticado antes de operar.
* Captura de IP localizada en middleware y propagada a sesión (evita fetch adicional en cliente).
* Diseño responsivo: paneles *sticky* en escritorio y layout compacto en móviles.
* Separación clara entre UI cliente y lógica server-only.
