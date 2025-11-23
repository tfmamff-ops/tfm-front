# Rotulado – Plataforma de verificación automática de rotulado

## Descripción general

Rotulado es la interfaz web de un sistema de visión artificial diseñado para acelerar la inspección de empaques farmacéuticos. El operador selecciona los datos esperados desde el ERP, captura o carga una fotografía y envía el material a un pipeline alojado en Azure Functions. La aplicación muestra los resultados de OCR, la lectura de códigos de barras y las validaciones realizadas sobre la etiqueta para facilitar la decisión de aprobación o rechazo.

## Objetivos del proyecto

- Reducir los errores manuales en la inspección de lotes farmacéuticos.
- Centralizar la interacción con el pipeline de Azure desde una experiencia guiada.
- Brindar trazabilidad de inspecciones y preparar la persistencia de resultados históricos.
- Integrarse de forma transparente con el ERP corporativo mediante exportaciones CSV.

## Tecnologías principales

- **Framework**: Next.js 15 con App Router y componentes mixtos (server/client) sobre React 19.
- **Estado global**: Zustand con middleware de persistencia y devtools aislados.
- **Interfaz de usuario**: Tailwind CSS 4, Radix UI, `lucide-react`, `react-webcam`, `react-dropzone`, `react-image-crop` y `sonner`.
- **Capa de servidor**: rutas API en `/app/api` y utilidades server-only en `src/server` para coordinar la comunicación con Azure Functions.
- **Datos**: Prisma Client contra PostgreSQL y mocks locales mediante `json-server` para el endpoint `expectedData`.
- **Autenticación**: NextAuth con Azure AD B2C, middleware de protección de rutas y mapeo de roles en `sessionToRequestContext`.

## Arquitectura funcional

1. El operador abre la pestaña de Configuración para descargar el CSV del ERP definido por `ERP_CONTAINER` y `BLOB_ERP_QUAD`.
2. Se selecciona un producto y se completan automáticamente lote, vencimiento y fecha de envasado.
3. La imagen se obtiene desde un archivo JPG/PNG o desde la cámara del navegador con compresión previa.
4. Al iniciar el procesamiento, la UI envía los datos al endpoint `/api/azure-analyze`, que solicita URLs SAS, sube la imagen al contenedor de entrada y dispara la Durable Function.
5. El frontend consulta el estado del pipeline, recibe las URLs temporales del resultado y actualiza contadores, overlays y mensajes de validación.
6. Los paneles laterales reutilizables muestran los datos configurados, la miniatura de la imagen y los totales de inspecciones.

## Autenticación y control de acceso

- Todo el contenido, incluidas las rutas API, requiere sesión válida.
- La variable `LOGIN_ENABLED` controla si la autenticación está activa (`true`, valor por defecto) o si se usa un usuario demo hardcodeado (`false`) para entornos locales.
- El middleware (`src/middleware.ts`) redirige a `/signin` cuando falta la cookie de sesión y adjunta `callbackUrl` para regresar al flujo principal.
- El proveedor Azure AD B2C entrega los datos del perfil que se normalizan en los callbacks `jwt` y `session`, donde también se incorpora la dirección IP obtenida por el middleware.
- `sessionToRequestContext` traduce la sesión a la estructura que espera el backend (`user` y `client`), incluyendo rol simplificado (`qa operator` → `qa_operator`).
- El cierre de sesión utiliza `signOut({ callbackUrl: "/api/auth/b2c-logout" })`, que delega en el flujo `end_session` de Azure AD B2C.

## Variables de entorno

### Pipeline y Azure Functions

| Variable | Descripción |
|----------|-------------|
| `AZURE_FUNC_HOST` | Host de la Function App (sin prefijo de protocolo). |
| `AZURE_FUNC_KEY_GET_SAS` | Clave de la función para generar SAS de lectura/escritura. |
| `AZURE_FUNC_KEY_HTTP_START` | Clave para iniciar la Durable Function de procesamiento. |
| `AZURE_FUNC_KEY_GENERATE_REPORT` | Clave para la función serverless que genera el informe (PDF) asociado a una inspección. |
| `AZURE_PIPELINE_TIMEOUT_MS` | (Opcional) Límite de espera del pipeline antes de lanzar error. |
| `AZURE_PIPELINE_POLL_MS` | (Opcional) Intervalo entre sondeos del estado del pipeline. |

### ERP y datos configurados

| Variable | Descripción |
|----------|-------------|
| `ERP_CONTAINER` | Contenedor Blob que aloja el CSV exportado del ERP. |
| `BLOB_ERP_QUAD` | Nombre del archivo CSV con productos y lotes. |

### Base de datos (Prisma - reservado para uso futuro)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL para historiales de procesamiento. |

### Autenticación (Azure AD B2C / NextAuth)

| Variable | Descripción |
|----------|-------------|
| `AZURE_AD_B2C_TENANT_NAME` | Nombre del tenant B2C sin sufijo `.onmicrosoft.com`. |
| `AZURE_AD_B2C_CLIENT_ID` | Identificador de la aplicación registrada en B2C. |
| `AZURE_AD_B2C_CLIENT_SECRET` | Secreto del cliente B2C. |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | User Flow principal (por ejemplo `B2C_1_signintfm`). |
| `NEXTAUTH_URL` | URL pública del frontend accesible por los usuarios. |
| `NEXTAUTH_SECRET` | Secreto para firmar JWT y estados en NextAuth. |
| `NEXTAUTH_DEBUG` | (Opcional) Activa el modo detallado de logging. |
| `LOGIN_ENABLED` | `true` para forzar autenticación; `false` usa usuario demo sin login (solo entornos locales). |

## Requisitos previos

- Node.js 20 o superior.
- PNPM 9.x.
- Docker y Docker Compose (opcional) para la base de datos PostgreSQL local.

## Puesta en marcha en desarrollo

1. Instalar dependencias con `pnpm install`.
2. Duplicar `.env.example` como `.env` y completar las variables descritas.
3. Ejecutar `pnpm dev` para levantar Docker Compose, Next.js con Turbopack y el servidor mock `json-server`.
4. Acceder a la aplicación desde el navegador en el puerto 3000.

### Servidores individuales

- `pnpm dev:next`: inicia Next.js en modo desarrollo sin servicios auxiliares.
- `pnpm dev:mock`: ejecuta exclusivamente el mock JSON en el puerto 4000.
- `pnpm docker:up` / `pnpm docker:down`: control manual del contenedor PostgreSQL.

## Construcción y despliegue con Docker

### Construcción local

1. Confirmar la presencia de `Dockerfile` y `.dockerignore` en la raíz del proyecto.
2. Construir la imagen con `docker build -t rotulado-frontend .`.

### Ejecución local de la imagen

- `docker run --rm -p 3000:3000 --env-file .env rotulado-frontend` para pruebas interactivas.
- `docker run -d --rm -p 3000:3000 --env-file .env rotulado-frontend` para mantener el contenedor en segundo plano.

### Publicación en un registro

- Docker Hub: etiquetar con `docker tag rotulado-frontend usuario/rotulado-frontend:latest` y subir con `docker push`.
- Azure Container Registry: iniciar sesión con `az acr login`, etiquetar como `<registro>.azurecr.io/rotulado-frontend:latest` y ejecutar `docker push`.

### Configuración en Azure App Service

1. Crear un App Service Linux basado en contenedor.
2. Seleccionar la imagen publicada en Docker Hub o Azure Container Registry.
3. Definir en Application Settings las variables de entorno requeridas (`AZURE_FUNC_HOST`, `AZURE_FUNC_KEY_GET_SAS`, `AZURE_FUNC_KEY_HTTP_START`, `AZURE_FUNC_KEY_GENERATE_REPORT`, `AZURE_PIPELINE_TIMEOUT_MS`, `AZURE_PIPELINE_POLL_MS`, `DATABASE_URL`, `ERP_CONTAINER`, `BLOB_ERP_QUAD`).
4. Azure abrirá el puerto 3000 del contenedor y expondrá la aplicación.

## Scripts de npm disponibles

- `pnpm dev`: orquesta Docker Compose, Next.js y el mock de datos.
- `pnpm dev:next`: desarrollo de la UI sin servicios auxiliares.
- `pnpm dev:mock`: mock del ERP para pruebas desconectadas.
- `pnpm build`: genera la compilación de producción mediante Turbopack.
- `pnpm start`: sirve la build generada.
- `pnpm lint`: ejecuta ESLint con la configuración de Next.js.
- `pnpm prisma:generate`, `pnpm prisma:push`, `pnpm prisma:studio`: comandos habituales de Prisma para el esquema `Processing` y `ROI`.

## Estructura del repositorio

```txt
├── src
│   ├── app/                # App Router, layout principal y rutas API
│   ├── components/         # Componentes de interfaz (layout, uploader, procesamiento)
│   ├── lib/                # Stores de Zustand, utilidades de payload e imagen, helpers de sesión
│   ├── server/             # Interacciones con Azure Functions y Prisma
│   ├── styles/             # Estilos globales
│   ├── types/              # Tipos compartidos y augmentations (NextAuth, etc.)
│   └── middleware.ts       # Middleware para autenticación y propagación de IP
├── prisma/                 # Esquema y migraciones del ORM (reservado para uso futuro)
├── mocks/                  # Configuración de json-server para datos simulados del ERP
├── docker/                 # Docker Compose para PostgreSQL local
└── public/                 # Recursos estáticos como logos e íconos
```

## Buenas prácticas implementadas

- `useAppStore` persiste selectivamente datos en `sessionStorage` y elimina Object URLs al cambiar de imagen para evitar fugas de memoria.
- La lógica de Azure se concentra en `src/server/azure.ts`, facilitando la sustitución del backend o la realización de pruebas unitarias.
- La autenticación se inicializa en `AuthBootstrap` y se refuerza con middleware, garantizando sesiones válidas antes de procesar datos sensibles.
- La IP del cliente se captura una única vez en el middleware y se adjunta a la sesión, evitando peticiones adicionales desde el cliente.
- El diseño responsivo conserva paneles informativos fijos en escritorio y reorganiza los bloques para pantallas móviles.
- La separación entre componentes de cliente y utilidades server-only mantiene las dependencias fuera del bundle del navegador.

## Próximos pasos sugeridos

- Incorporar pruebas automatizadas del flujo crítico de procesamiento y del pipeline de Azure.
- Ampliar la cobertura de roles y políticas en Azure AD B2C para granularidad de permisos.
