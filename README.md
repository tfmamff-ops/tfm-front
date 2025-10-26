# Rotulado – Verificación automática de rotulado

Este repositorio contiene la interfaz web del proyecto **Rotulado**, una aplicación de visión artificial orientada al control de calidad farmacéutico. El operador puede seleccionar los datos esperados desde el ERP, capturar o subir una fotografía del empaque y enviar el material a un pipeline en Azure Functions que realiza OCR, detección de códigos de barras y validaciones automáticas. El objetivo principal es acelerar la inspección de lotes y reducir errores manuales.

## Características principales

- **Experiencia guiada en dos pasos**: pestañas de _Configuración_ y _Procesamiento_ que ordenan el flujo operativo y bloquean acciones cuando faltan datos obligatorios.
- **Integración con ERP**: lectura de un CSV alojado en Azure Blob Storage para poblar el selector de productos y completar automáticamente lote, vencimiento y fecha de envasado.
- **Múltiples fuentes de imagen**: subida de archivos JPG/PNG o captura directa desde la cámara del navegador con compresión previa para optimizar el envío.
- **Previsualización y seguimiento**: paneles laterales reutilizables que muestran los datos configurados, la miniatura de la imagen actual y contadores de inspecciones OK/Rechazo.
- **Orquestación en Azure**: la UI invoca un endpoint Next.js que solicita URLs SAS, sube la imagen al contenedor de entrada, dispara la Durable Function y espera el resultado final.
- **Resultados enriquecidos**: despliegue de texto OCR, estado del código de barras, overlays generados por el backend y resumen de validaciones para una rápida toma de decisiones.
- **Persistencia preparada**: esquema Prisma listo para almacenar historiales de procesamiento y regiones de interés en una base PostgreSQL.

## Arquitectura

- **Framework**: Next.js 15 con el _App Router_, React 19 y soporte server/client components.
- **Estado global**: Zustand con middleware de persistencia y _devtools_ separados para el contexto de autenticación y el estado operativo de la inspección.
- **UI**: Tailwind CSS 4, componentes Radix UI (tabs, selects, hover cards) y librerías auxiliares como `lucide-react`, `react-webcam` y `sonner`.
- **Capa de servidor**: rutas API en `/app/api` para comunicarse con Azure Functions y normalizar las respuestas del pipeline; utilidades server-only en `src/server/`.
- **Datos**: Prisma Client como ORM (modelo `Processing` + `ROI`) y mocks locales vía `json-server` para el endpoint `/api/expectedData` cuando no se dispone del entorno de nube.

## Flujo funcional

1. La vista de Configuración descarga el CSV del ERP y permite seleccionar un producto para completar los valores esperados.
2. El operador adjunta una imagen o toma una captura; la aplicación genera una URL de previsualización y almacena metadatos en el store.
3. Al presionar **Procesar**, se construye un `FormData` con la imagen, los datos esperados y el contexto del usuario.
4. El endpoint `/api/azure-analyze` solicita una SAS de carga, sube el archivo, inicia la Durable Function y comienza a consultar su estado.
5. Una vez completado el pipeline, la API devuelve enlaces temporales a las imágenes procesadas, el resultado OCR, el estado del código de barras y las validaciones.
6. El store actualiza contadores, presenta los overlays y muestra mensajes de error en caso de fallos en cualquier etapa.

## Requisitos previos

- Node.js 20 o superior.
- PNPM 9.x.
- Docker (opcional) para levantar la base de datos PostgreSQL local.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   pnpm install
   ````

2. Copiar `.env.example` a `.env.local` (crearlo si no existe) y definir las variables listadas en la sección de configuración.

3. Inicializar los servicios auxiliares y el entorno de desarrollo:

   ```bash
   pnpm dev
   ```

   Este comando levanta PostgreSQL mediante Docker Compose y, en paralelo, ejecuta Next.js con Turbopack y el servidor mock (`json-server`) que emula las respuestas del ERP.

4. Acceder a `http://localhost:3000`.

### Scripts disponibles

- `pnpm dev:next`: inicia Next.js en modo desarrollo sin dependencias externas.
- `pnpm dev:mock`: lanza únicamente el mock JSON en el puerto 4000.
- `pnpm dev`: orquesta Docker Compose y ambos procesos anteriores.
- `pnpm docker:up` / `pnpm docker:down`: control manual del contenedor PostgreSQL.
- `pnpm prisma:generate`, `pnpm prisma:push`, `pnpm prisma:studio`: tareas habituales de Prisma.
- `pnpm build`: compila la aplicación para producción.
- `pnpm start`: sirve la build generada.
- `pnpm lint`: ejecuta ESLint con la configuración de Next.js.

## Variables de entorno

Definir las siguientes variables en `.env.local` para habilitar la integración con Azure y la base de datos:

| Variable                    | Descripción                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `AZURE_FUNC_HOST`           | Host de la Function App que expone los endpoints `sas` y `process`. |
| `AZURE_FUNC_KEY_GET_SAS`    | API key para el endpoint que genera SAS de lectura/escritura.       |
| `AZURE_FUNC_KEY_HTTP_START` | API key para iniciar la Durable Function de procesamiento.          |
| `AZURE_PIPELINE_TIMEOUT_MS` | (Opcional) Tiempo máximo de espera del pipeline en milisegundos.    |
| `AZURE_PIPELINE_POLL_MS`    | (Opcional) Intervalo entre sondeos de estado.                       |
| `DATABASE_URL`              | Cadena de conexión PostgreSQL utilizada por Prisma.                 |

Para pruebas sin Azure se puede ejecutar solo el mock (`pnpm dev:mock`) y adaptar los componentes a datos locales.

## Estructura de carpetas

```
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

- El store principal (`useAppStore`) persiste selectivamente datos sensibles en `sessionStorage` y limpia recursos (Object URLs) al cambiar la imagen.
- Las llamadas a Azure están encapsuladas en `src/server/azure.ts`, facilitando el testeo con _stubs_ o servicios alternativos.
- El layout raíz monta un _Hydration Gate_ y `AuthBootstrap` para preparar un contexto de usuario temporal hasta integrar un proveedor real.
- Se fomenta el diseño responsivo: los paneles laterales son _sticky_ en escritorio y se apilan en pantallas pequeñas.

---

Para dudas o mejoras adicionales, revisar los componentes dentro de `src/components/` y las utilidades de `src/lib/`, donde se concentra la lógica específica del dominio.
