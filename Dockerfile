# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Copy startup script
COPY start.sh ./
RUN chmod +x ./start.sh

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=8080

# Use dumb-init to run Node.js
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the application using the startup script
CMD ["./start.sh"]
