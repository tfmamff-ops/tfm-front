
# Scripts

## Basic scripts

```bash
# THIS IS THE ONLY COMMAND TO START THE APP.
# Runs the local app, docker, json-server API mocks, etc.
# Note: pnpm install may be required
pnpm dev
```

## Useful scripts

```bash
# Start DB container
pnpm docker:up

# Stop DB container
pnpm docker: down

# Generate schema and client.
# Then you can use the UI (Prisma Studio) or any DB client (e.g., DBeaver).
pnpm prisma:push
pnpm prisma:generate
pnpm prisma:studio
```

## Production

```bash
pnpm build
pnpm start
```

## shadcn (example)

```bash
pnpm dlx shadcn@latest add tabs
```

## ngrok (mobile)

```bash
https://dashboard.ngrok.com/get-started/setup/windows
ngrok http 3000
```
