FROM node:20-bullseye as builder
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install dependencies (including devDependencies for build)
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# Copy the rest of the application code
# .dockerignore excludes node_modules, package-lock.json, etc.
COPY . .

# Set Vite Environment Variable during build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Fix heap out-of-memory issue by increasing memory limit for Node.js
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Serve the built files with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean up default nginx 50x error page (optional)
RUN rm -rf /usr/share/nginx/html/50x.html

EXPOSE 80
