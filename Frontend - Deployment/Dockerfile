# ---------- Development stage (local use) ----------
FROM node:20-bullseye as dev
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Configure npm for resilience (helps with local flaky internet)
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install dependencies
RUN npm install --legacy-peer-deps

# Explicitly reinstall native binary packages to avoid MODULE_NOT_FOUND errors
RUN npm install rollup --force \
    && npm install @tailwindcss/oxide --force \
    && npm install esbuild --force

# Copy source code
COPY . .

# Default command for local dev (hot reload)
CMD ["npm", "run", "dev"]

# ---------- Build stage (cloud use) ----------
FROM node:20-bullseye as builder
WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Ensure native Linux binaries for build tools are installed to avoid MODULE_NOT_FOUND
RUN npm install @rollup/rollup-linux-x64-gnu --force \
    && npm install @tailwindcss/oxide-linux-x64-gnu --force \
    && npm install lightningcss-linux-x64-gnu --force

# Copy the rest of the application code
COPY . .

# Fix heap out-of-memory issue by increasing memory limit for Node.js
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# ---------- Production stage (nginx) ----------
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean up default nginx 50x error page (optional)
RUN rm -rf /usr/share/nginx/html/50x.html

EXPOSE 80
