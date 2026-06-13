# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# AI Coach Monitoring Dashboard — production image (Next.js standalone)
# Built for Coolify (or any Docker host).
#
# IMPORTANT: NEXT_PUBLIC_* values are inlined into the JS bundle at BUILD time,
# so the backend URL must be provided as a build argument, not just at runtime.
# In Coolify set a Build Variable / build arg:
#   NEXT_PUBLIC_API_BASE_URL=https://coach.senecole.com
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base

# 1) Install dependencies (cached unless package files change)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the standalone output
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env (inlined into the client bundle). Default points at the
# production backend; override via Coolify build args.
ARG NEXT_PUBLIC_API_BASE_URL=https://coach.senecole.com
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3) Minimal runtime image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the standalone server, static assets and public files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
