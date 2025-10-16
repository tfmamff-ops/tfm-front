
# Scripts

## Scripts básicos

```bash
# ESTO ES LO ÚNICO QUE DEBO EJECUTAR PARA LEVANTAR LA APP.
# Ejecuta la aplicación local, levantando docker, la aplicación, los api mocks, etc.
# obs: pnpm install puede ser necesario
pnpm dev
```

## Scripts útiles

```bash
# Levanta contenedor con la base
pnpm docker:up

# Baja contenedor con la base
pnpm docker: down

# Genera esquema y cliente. 
# Permite usar UI (prisma studio) o puedo usar dbeaver.
pnpm prisma:push
pnpm prisma:generate
pnpm prisma:studio
```

## Prod

```bash
pnpm build
pnpm lint
pnpm start
```

# npmp

```bash
pnpm dlx shadcn@latest add tabs
```

# ngrok (mobile)

```bash
https://dashboard.ngrok.com/get-started/setup/windows
ngrok http 3000
```