# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments passed at build time
ARG NEXT_PUBLIC_AUTH_API_URL=""
ARG NEXT_PUBLIC_USER_API_URL=""
ARG NEXT_PUBLIC_BACKEND_API_URL=""
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_DEV_AUTH_BYPASS=""

# Build the application with standalone output
# Environment variables are passed to the build process
RUN NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL \
    NEXT_PUBLIC_USER_API_URL=$NEXT_PUBLIC_USER_API_URL \
    NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_DEV_AUTH_BYPASS=$NEXT_PUBLIC_DEV_AUTH_BYPASS \
    npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start Next.js standalone server
CMD ["node", "server.js"]
