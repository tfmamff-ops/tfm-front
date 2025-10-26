#########################################################
# STAGE 1: builder
#########################################################
FROM node:20-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Enable pnpm using corepack (included with Node 20)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy only the minimal files first (to leverage Docker cache)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (dev + prod) required to build the project
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code (filtered by .dockerignore)
COPY . .

# Build the production version of the Next.js app
RUN pnpm build


#########################################################
# STAGE 2: runner
#########################################################
FROM node:20-slim AS runner

# Set working directory for runtime container
WORKDIR /app

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Enable pnpm for runtime container
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package definition files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy the standalone output from the build stage
# .next/standalone contains server.js and the minimal code needed to run
COPY --from=builder /app/.next/standalone ./

# Copy Next.js static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets (logos, icons, etc.)
COPY --from=builder /app/public ./public

# Expose the internal port that the container will listen on
EXPOSE 3000

# Final command: start the standalone Next.js server
CMD ["node", "server.js"]
