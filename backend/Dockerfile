# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies for Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browser (chromium only)
RUN npx playwright install chromium

# Copy source code
COPY . .

# Stage 2: Runner
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HEADLESS=true
ENV DOCKER=true
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create directories with correct permissions
RUN mkdir -p /app/logs /app/logs/screenshots /app/browser-data \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

CMD ["npm", "start"]