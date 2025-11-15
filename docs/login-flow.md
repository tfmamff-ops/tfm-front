# Anatomía del login y decisiones de diseño

Este documento sirve como bitácora técnica breve: explica qué piezas componen el login, cómo se hablan entre sí y, sobre todo, por qué se tomaron esas decisiones. Está pensado para que, dentro de un año, cualquier persona que programe pueda retomar el tema sin volver a leer todo el repositorio.

## 1. Objetivo del sistema

1. **Autenticación corporativa real** (Azure AD B2C) para producción, con datos de perfil suficientes para auditar (nombre, email, job title, IP).
2. **Modo operativo sin identidad** para demos, QA o emergencias. Debe activarse sólo moviendo una variable de entorno, sin redeploy.

De aquí surge la idea del *interruptor* `LOGIN_ENABLED`. Toda la arquitectura se construyó para que ambas experiencias compartan el mismo layout y que la UI siempre sepa en qué modo está.

## 2. Mapa rápido de componentes

| Capa | Archivo(s) | Rol |
| --- | --- | --- |
| Configuración | `src/config/auth.ts` | Expone `isLoginEnabled()` y mantiene el fallback `NEXT_PUBLIC_LOGIN_ENABLED` para entornos donde los secretos privados no existen. |
| Guardia global | `src/middleware.ts` | Inspecciona cada request: captura la IP, decide si exigir login y redirige a `/signin` cuando falta sesión. |
| Servicio de identidad | `src/app/api/auth/[...nextauth]/route.ts` | Configura NextAuth con Azure AD B2C, normaliza claims y empaqueta la sesión en JWT. |
| Puente servidor→cliente | `src/components/AuthBootstrap.tsx` + `src/components/AuthSessionProvider.tsx` | Hidratan la sesión y el flag `loginEnabled` al contexto React para evitar lecturas repetidas del servidor. |
| Capa de UI | `src/components/layout/AppHeader.tsx` y otras | Consumen el contexto/estado para mostrar el usuario o, si aplica, el aviso de modo demo. |
| Página de acceso | `src/app/signin/page.tsx` + `SignInClient.tsx` | Es un embudo controlado: si el login está activo lanza la autenticación, si no lo está regresa al home. |

## 3. Cómo fluye una petición

1. **Request entra al middleware.** Se lee `LOGIN_ENABLED`. Si está apagado se marca el request como "public" y se continúa; si está encendido se busca una sesión activa.
2. **Captura de IP.** Antes de pasar el request al servidor de NextAuth, la IP (de `x-forwarded-for` o `ip`) se guarda en una cabecera y en una cookie ligera. Eso permite que los callbacks tengan acceso sin depender de infra externa.
3. **Redirección a `/signin`.** Si no hay sesión y el modo requiere login, se envía al usuario a `/signin?next=...` para preservar la ruta original.
4. **SignIn server component.** Revalida `isLoginEnabled()` para no mostrar la pantalla cuando la bandera está apagada. Si todo sigue igual, renderiza el cliente que ejecuta `signIn("azure-ad-b2c")` en cuanto monta.
5. **Callbacks de NextAuth.**

    - `signIn` agrega `requestIp` y `jobTitle` al token.
    - `jwt` persiste esos campos entre requests.
    - `session` devuelve al front todo lo necesario (usuario, IP, flag), evitando llamadas adicionales.
6. **Hidratación en React.** `AuthBootstrap` recibe la sesión pre-creada en el servidor y se la pasa a `AuthSessionProvider`. Este decide si renderiza `SessionProvider` (sólo cuando el login está activo) y publica el contexto `AuthModeContext` siempre.
7. **Estado compartido.** El store global (`auth-store.ts`) escucha los datos que trae `AuthBootstrap` y mantiene sincronizados nombre, job title y avisos para otros componentes.

## 4. Decisiones clave y motivación

- **Interruptor único (`LOGIN_ENABLED`).** Evita configuraciones divergentes entre server y cliente. El fallback público (`NEXT_PUBLIC_LOGIN_ENABLED`) se agregó para Vercel previews donde no hay secretos privados.
- **Middleware en vez de layout-only guards.** Garantiza que APIs y páginas compartan la misma lógica y permite adjuntar la IP antes de tocar NextAuth (importante para auditoría).
- **SessionProvider condicionado.** En modo demo no tiene sentido inicializar NextAuth ni revalidar tokens; por eso `AuthSessionProvider` sólo crea el provider cuando lo necesita y, aun así, expone `loginEnabled` al resto de la UI.
- **Redirección server-side en `/signin`.** Previene parpadeos: si el login está apagado, nunca se muestra la pantalla de "estamos redirigiendo".
- **Callback enriquecido.** Se eligió JWT para evitar base de datos adicional; los campos extras se guardan en el token mismo. Esto permite mostrar job title e IP sin otra llamada.

## 5. Resumen

- Toda petición pasa por el middleware, que decide según `LOGIN_ENABLED` si la deja pasar o la fuerza a `/signin`.
- NextAuth (Azure AD B2C) arma un JWT con los campos que necesitamos y lo entrega al cliente ya hidratado.
- `AuthSessionProvider` es el puente que evita duplicar lógica: invoca `SessionProvider` sólo cuando hace falta y, de todos modos, informa al resto de la UI si estamos en modo demo.
- Cada decisión tuvo como eje poder cambiar entre modo seguro y demo sin desplegar ni tocar más código que las variables de entorno.
