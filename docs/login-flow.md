# Anatomía del login y decisiones de diseño

Este documento sirve como bitácora técnica breve: explica qué piezas componen el login, cómo se hablan entre sí y, sobre todo, por qué se tomaron esas decisiones. Está pensado para que, dentro de un año, cualquier persona que programe pueda retomar el tema sin volver a leer todo el repositorio.

## 1. Objetivo del sistema

1. **Autenticación corporativa real** (Azure AD B2C) para producción, con datos de perfil suficientes para auditar (nombre, email, job title, IP).
2. **Modo operativo sin identidad** para demos, QA o emergencias. Debe activarse sólo moviendo una variable de entorno, sin redeploy.

De aquí surge la idea del *interruptor* `LOGIN_ENABLED`. Ya no se exporta como constante estática: todo pasa por el helper `isLoginEnabled()`, que lee la variable en tiempo de ejecución para que el servidor y el cliente vean el mismo estado sin recompilar.

## 2. Mapa rápido de componentes

| Capa | Archivo(s) | Rol |
| --- | --- | --- |
| Configuración | `src/config/auth.ts` | Única fuente de verdad. `isLoginEnabled()` evalúa la variable de entorno en runtime para server components, middleware y APIs. |
| Endpoint de config | `src/app/api/auth/config/route.ts` | Devuelve `{ loginEnabled }` usando `isLoginEnabled()`. El browser lo consulta para sincronizarse con el servidor. |
| Guardia global | `src/middleware.ts` | Inspecciona cada request: captura la IP, decide si exigir login y redirige a `/signin` cuando falta sesión. |
| Servicio de identidad | `src/app/api/auth/[...nextauth]/route.ts` | Configura NextAuth con Azure AD B2C, normaliza claims y empaqueta la sesión en JWT. |
| Puente servidor→cliente | `src/components/AuthBootstrap.tsx` + `src/components/AuthSessionProvider.tsx` | El layout server pasa `initialLoginEnabled`. Luego el provider hace `fetch("/api/auth/config")` para confirmar el estado real y alimentar `useAuthMode()`. |
| Capa de UI | `src/components/layout/AppHeader.tsx` y otras | Consumen el contexto/estado para mostrar el usuario o, si aplica, el aviso de modo demo. |
| Página de acceso | `src/app/signin/page.tsx` + `SignInClient.tsx` | Es un embudo controlado: si el login está activo lanza la autenticación, si no lo está regresa al home. |

## 3. Cómo fluye una petición

1. **Request entra al middleware.** Invoca `isLoginEnabled()` (runtime) en cada request. Si está apagado se marca el request como "public" y se continúa; si está encendido se busca una sesión activa.
2. **Captura de IP.** Antes de pasar el request al servidor de NextAuth, la IP (de `x-forwarded-for` o `ip`) se guarda en una cabecera y en una cookie ligera. Eso permite que los callbacks tengan acceso sin depender de infra externa.
3. **Redirección a `/signin`.** Si no hay sesión y el modo requiere login, se envía al usuario a `/signin?next=...` para preservar la ruta original.
4. **SignIn server component.** Revalida `isLoginEnabled()` para no mostrar la pantalla cuando la bandera está apagada. Si todo sigue igual, renderiza el cliente que ejecuta `signIn("azure-ad-b2c")` en cuanto monta.
5. **Callbacks de NextAuth.**

    - `signIn` agrega `requestIp` y `jobTitle` al token.
    - `jwt` persiste esos campos entre requests.
    - `session` devuelve al front todo lo necesario (usuario, IP, flag), evitando llamadas adicionales.
6. **Hidratación en React.** `AuthBootstrap` recibe la sesión pre-creada en el servidor y se la pasa a `AuthSessionProvider`. El layout le entregó el flag inicial (`initialLoginEnabled = isLoginEnabled()`), pero el provider lo confirma en el cliente llamando a `/api/auth/config`. Sólo crea `SessionProvider` cuando el login está activo; aun así mantiene `AuthModeContext` actualizado para toda la UI.
7. **Estado compartido.** El store global (`auth-store.ts`) escucha los datos que trae `AuthBootstrap` y mantiene sincronizados nombre, job title y avisos para otros componentes.

## 4. Decisiones clave y motivación

- **Interruptor único (`LOGIN_ENABLED`).** El valor se lee únicamente mediante `isLoginEnabled()` para que los cambios en App Service se reflejen al instante sin volver a construir la app. El endpoint `/api/auth/config` reutiliza la misma lógica para el cliente.
- **Middleware en vez de layout-only guards.** Garantiza que APIs y páginas compartan la misma lógica y permite adjuntar la IP antes de tocar NextAuth (importante para auditoría).
- **SessionProvider condicionado + sync en el cliente.** En modo demo no tiene sentido inicializar NextAuth; por eso `AuthSessionProvider` sólo crea el provider cuando lo necesita. Aun en demo, el hook `useAuthMode()` publica el estado exacto porque el provider confirma el dato con `/api/auth/config`.
- **Redirección server-side en `/signin`.** Previene parpadeos: si el login está apagado, nunca se muestra la pantalla de "estamos redirigiendo".
- **Callback enriquecido.** Se eligió JWT para evitar base de datos adicional; los campos extras se guardan en el token mismo. Esto permite mostrar job title e IP sin otra llamada.

## 5. Resumen

- Toda petición pasa por el middleware, que consulta `isLoginEnabled()` en runtime para decidir si deja pasar o fuerza `/signin`.
- NextAuth (Azure AD B2C) arma un JWT con los campos que necesitamos y lo entrega al cliente ya hidratado.
- `AuthSessionProvider` recibe el flag inicial del layout, lo vuelve a confirmar llamando a `/api/auth/config` y expone el resultado mediante `useAuthMode()`.
- Cada decisión tuvo como eje poder cambiar entre modo seguro y demo sin desplegar ni tocar más código que las variables de entorno.
