### Resumen Completo del Proyecto: Verificación de Rotulado

Este documento es el plan maestro para desarrollar tu interfaz web. Cubre la tecnología, la estructura del proyecto, las bibliotecas recomendadas y el flujo de trabajo completo de la aplicación.

### 1\. El Stack Tecnológico 🛠️

  * **Framework Principal**: **Next.js** con el **App Router**. Usaremos su capacidad de renderizado en el servidor para cargar datos iniciales.
  * **Lenguaje**: **TypeScript**. Para un código más seguro, mantenible y con mejor autocompletado.
  * **Estilos y UI**:
      * **Tailwind CSS**: Para crear una interfaz moderna y totalmente responsive de manera rápida y personalizable.
      * **Componentes UI**: **Shadcn/ui**. Esta es la mejor opción para tu caso. **No es una librería de componentes tradicional**, sino una colección de componentes reutilizables que instalas directamente en tu proyecto. Son totalmente personalizables con Tailwind CSS, accesibles y te dan control total sobre el código. Usarás componentes como `Card`, `Button`, `Table`, `Select`, `Input`, etc., de esta colección.
  * **Gestión de Estado**: **Zustand**. Una alternativa simple y potente a Redux. Usaremos su middleware `persist` para guardar el estado de la aplicación en el navegador y que no se pierda al recargar la página (F5).
  * **Base de Datos**: **PostgreSQL** o **MySQL**. Para almacenar y recuperar el historial de procesamientos.
  * **Bibliotecas Clave Adicionales**:
      * **`xlsx`**: Para leer los datos del archivo Excel directamente en el navegador.
      * **`react-dropzone`**: Para crear el área de "arrastrar y soltar" para subir el archivo Excel.
      * **`react-webcam`**: Para acceder a la cámara del dispositivo y tomar fotos.
      * **`export-to-csv`**: Para implementar la funcionalidad de "Exportar a CSV".
      * **`react-image-crop`**: Para recortar el código de barras.

-----

### 2\. Creación y Estructura del Proyecto 🏗️

#### **Paso A: Creación del Proyecto**

Abre tu terminal y ejecuta este comando. Te creará un nuevo proyecto Next.js con TypeScript y Tailwind CSS listos para usar.

```bash
npx create-next-app@latest verificacion-rotulado --ts --tailwind --eslint
```

#### **Paso B: Configuración de Shadcn/ui**

Una vez creado el proyecto, entra en la carpeta (`cd verificacion-rotulado`) y ejecuta el inicializador de Shadcn/ui. Te hará algunas preguntas de configuración; puedes aceptar los valores por defecto.

```bash
npx shadcn-ui@latest init
```

Ahora, cada vez que necesites un componente (un botón, una tabla), simplemente lo añadirás con un comando como: `npx shadcn-ui@latest add button`.

#### **Paso C: Estructura de Carpetas**

Dentro de la carpeta `src/`, esta será nuestra organización:

```
src/
├── app/
│   ├── layout.tsx         # Layout raíz de la aplicación
│   └── page.tsx           # ¡Tu página principal! Aquí vivirá la mayor parte de la lógica.
│
├── components/
│   ├── ui/                # Aquí se guardarán los componentes de Shadcn (Button, Table, etc.)
│   └── icons.tsx          # Un componente para manejar los íconos fácilmente.
│   ├── lot-config-panel.tsx   # Panel izquierdo para cargar Excel y configurar lote.
│   ├── camera-panel.tsx       # Panel central con la cámara y la foto.
│   ├── results-panel.tsx      # Panel derecho con los resultados del OCR.
│   └── history-table.tsx      # La tabla inferior con el historial reciente.
│
├── lib/
│   ├── db.ts              # Lógica para la conexión con tu base de datos.
│   └── utils.ts           # Funciones de utilidad generales.
│
└── store/
    └── useAppStore.ts     # Aquí definiremos nuestro "store" de Zustand.
```

-----

### 3\. Flujo de Funcionamiento de la Aplicación (Paso a Paso) ⚙️

1.  **Inicio y Carga de Datos**:

      * El usuario abre la aplicación.
      * El componente `page.tsx` se ejecuta **en el servidor**. Se conecta a tu base de datos (usando la lógica de `lib/db.ts`) y recupera los últimos 10-20 registros del historial.
      * Estos datos iniciales se usan para "hidratar" (cargar el estado inicial) el store de Zustand. Gracias al middleware `persist`, si el usuario ya tenía un estado guardado en su navegador, este se recuperará.

2.  **Configuración del Lote (Panel Izquierdo)**:

      * El usuario arrastra y suelta un archivo Excel en el componente `<LotConfigPanel />` (que usará `react-dropzone`).
      * La biblioteca `xlsx` lee el archivo en el navegador.
      * La información relevante (producto, lote esperado, vencimiento esperado) se extrae y se guarda en el store de Zustand, actualizando la UI.

3.  **Captura de Imagen (Panel Central)**:

      * El componente `<CameraPanel />` muestra la vista de la cámara usando `react-webcam`.
      * El usuario puede subir una foto o tomar una con la cámara. La imagen capturada se muestra en la interfaz y se guarda (como un objeto File o Base64) en el store de Zustand.

4.  **Procesamiento y OCR**:

      * El usuario presiona el botón "Procesar".
      * La aplicación toma la imagen y la información del lote esperado del store de Zustand y la envía al servicio de Azure.
      * La aplicación espera la respuesta del OCR.

5.  **Visualización de Resultados (Panel Derecho)**:

      * Azure responde con los datos leídos (Lote, Vencimiento, etc.).
      * Esta respuesta se guarda en el store.
      * El componente `<ResultsPanel />` (que está "escuchando" los cambios en el store) se actualiza automáticamente, mostrando los datos del OCR y comparándolos con los "esperados".
      * Simultáneamente, se crea un nuevo registro de historial (con hora, datos leídos, resultado OK/Rechazo) y se añade al array de `historial` en el store. Esto también se guarda en la base de datos para futuras cargas.

6.  **Interactividad con la Tabla de Historial**:

      * El componente `<HistoryTable />` (que usa el componente `Table` de Shadcn/ui) se actualiza automáticamente al añadirse el nuevo registro.
      * Si el usuario hace clic en una fila antigua de la tabla, una función en el store actualiza el `itemSeleccionado`.
      * El `<ResultsPanel />` reacciona a este cambio y muestra la información de ese registro histórico específico.

7.  **Exportación a CSV**:

      * El usuario hace clic en "Exportar CSV".
      * Se activa una función que lee el array completo del `historial` desde el store de Zustand.
      * Usando `export-to-csv`, se genera un archivo CSV en el momento y se inicia su descarga en el navegador del usuario.