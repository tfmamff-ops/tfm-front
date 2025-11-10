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

La aplicación protege todas las rutas (páginas y `/api`) y fuerza inicio de sesión automático usando **Azure AD B2C** y **NextAuth**.

### Resumen del flujo

1. El visitante accede a `/` sin sesión.
2. El `middleware` (`src/middleware.ts`) detecta ausencia de la cookie `next-auth.session-token` y redirige a `/signin` con `callbackUrl`.
3. La página `/signin` dispara `signIn("azure-ad-b2c", { callbackUrl: "/" })`.
4. Azure AD B2C autentica y devuelve al callback de NextAuth (`/api/auth/callback/azure-ad-b2c`).
5. NextAuth crea la sesión y coloca la cookie; el usuario es redirigido a `/`.
6. `AuthBootstrap` lee la sesión mediante `useSession()` y traduce los datos a `requestContext` vía `sessionToRequestContext`.
7. Las APIs (`/api/azure-analyze`, `/api/expectedData`) validan de nuevo la sesión en servidor con `getServerSession(authOptions)` (defensa en profundidad).

### Mapeo de claims

La función `profile` del proveedor B2C:

* Construye `email` con `emails[0]` ó `email` si existe.
* Genera `name` usando `name` o `given_name + family_name`.
* Conserva `sub` como `user.id` y `jobTitle` se normaliza a `user.role` en `jwt`/`session` callbacks.

### Helper de sesión

`sessionToRequestContext` (en `src/lib/session-to-context.ts`) crea un objeto estable con:

* `user: { id, name, email?, role }`
* `client: { appVersion, ip, userAgent }`

### Rutas públicas

Sólo se permiten sin sesión:
`/signin`, `/api/auth/*`, `/_next/*`, `/images/*`, `/public/*`, `favicon.ico`, `robots.txt`, `sitemap.xml`.

### Añadir nuevos claims

1. Activar el claim en el User Flow de Azure AD B2C (Application claims).
2. Si se requiere durante el registro, habilitarlo como *User attribute collected*.
3. Extender el callback `jwt` y/o `profile` para introducir el claim en el token.
4. Actualizar `sessionToRequestContext` si el claim se usará en el store.

### Variables adicionales de Auth

| Variable | Uso |
|---------|-----|
| `AZURE_AD_B2C_TENANT_NAME` | Nombre del tenant B2C (sin `.onmicrosoft.com`). |
| `AZURE_AD_B2C_CLIENT_ID` | ID de la aplicación registrada. |
| `AZURE_AD_B2C_CLIENT_SECRET` | Secreto del cliente (rotar regularmente). |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | User Flow principal (ej. `B2C_1_signupsigninflow`). |
| `NEXTAUTH_URL` | URL base pública del frontend. |
| `NEXTAUTH_SECRET` | Secreto para firmar JWT/estado. |

### Rotación de secretos

1. Generar nuevo Client Secret en la App Registration de B2C.
2. Actualizar `.env.local` con el valor y nunca commitear.
3. Regenerar `NEXTAUTH_SECRET` (por ejemplo `openssl rand -hex 32`).
4. Reiniciar la aplicación.

### Errores conocidos

* `OAUTH_PARSE_PROFILE_ERROR` ocurría cuando faltaba el claim `emails`; se mitigó con `profile()` defensivo.
* Loops en `/signin` se evitan forzando siempre `callbackUrl: '/'`.

### Defensa en profundidad

El middleware impide acceso sin cookie, y las APIs revalidan sesión con `getServerSession`. Esto cubre escenarios donde una ruta pública pudiera intentar invocar directamente un handler.

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

Definir las siguientes variables en `.env` para habilitar la integración con Azure, el ERP y la base de datos:

| Variable                    | Descripción                                                               |
| --------------------------- | ------------------------------------------------------------------------- |
| `AZURE_FUNC_HOST`           | Host de la Function App que expone los endpoints `sas` y `process`.       |
| `AZURE_FUNC_KEY_GET_SAS`    | API key para el endpoint que genera SAS de lectura/escritura.             |
| `AZURE_FUNC_KEY_HTTP_START` | API key para iniciar la Durable Function de procesamiento.                |
| `AZURE_PIPELINE_TIMEOUT_MS` | (Opcional) Tiempo máximo de espera del pipeline en milisegundos.          |
| `AZURE_PIPELINE_POLL_MS`    | (Opcional) Intervalo entre sondeos de estado.                             |
| `DATABASE_URL`              | Cadena de conexión PostgreSQL utilizada por Prisma (uso futuro).          |
| `ERP_CONTAINER`             | Nombre del contenedor en Azure Blob Storage donde reside el CSV del ERP.  |
| `BLOB_ERP_QUAD`             | Nombre del archivo CSV exportado desde el ERP con los datos de productos. |

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

* El store principal (`useAppStore`) persiste selectivamente datos sensibles en `sessionStorage` y limpia recursos (Object URLs) al cambiar la imagen.
* Las llamadas a Azure están encapsuladas en `src/server/azure.ts`, facilitando el testeo con *stubs* o servicios alternativos.
* El layout raíz monta un *Hydration Gate* y `AuthBootstrap` para hidratar el contexto de usuario autenticado.
* Se fomenta el diseño responsivo: los paneles laterales son *sticky* en escritorio y se apilan en pantallas pequeñas.
