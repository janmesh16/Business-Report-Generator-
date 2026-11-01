# Production Dockerfile for Ledgerly (Frontend + Backend + Puppeteer + SQLite)
FROM node:22-slim

# Install Chromium and system dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium executable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

# Install ALL dependencies (including dev tools for build)
RUN npm install --include=dev && \
    npm --prefix server install --include=dev && \
    npm --prefix client install --include=dev

# Copy all source code
COPY . .

# Build client and server
RUN npm run build

# Set production environment AFTER building
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_PATH=/app/data/ledgerly.db

# Create persistent data and temporary upload directories
RUN mkdir -p /app/data /app/uploads_temp

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
