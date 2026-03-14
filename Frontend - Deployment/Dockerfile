# ---------- Development stage (local use) ----------
FROM node:20-bullseye as dev
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Default command for local dev
CMD ["npm", "run", "dev"]

# ---------- Build stage (cloud use) ----------
FROM node:20-bullseye as builder
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build production bundle
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# ---------- Production stage (nginx) ----------
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/50x.html

EXPOSE 80