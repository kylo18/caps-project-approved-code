# Stage 1: Build the frontend
FROM node:20-alpine AS build-stage

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Optional: Fix case-sensitive file issues (for Linux)
RUN \
  [ -f src/assets/login-bg.png ] && mv src/assets/login-bg.png src/assets/Login-bg.png || true && \
  [ -f src/components/searchBar.jsx ] && mv src/components/searchBar.jsx src/components/searchbar.jsx || true

# Build the frontend
RUN npm run build

# Stage 2: Serve using NGINX
FROM nginx:stable-alpine AS production-stage

# Copy the built frontend to NGINX's serving directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom NGINX config (adjusted to correct path relative to the build context)
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Optional: SSL certificates are handled in Docker Compose, so no need to copy them here
# COPY ./nginx/certs /etc/nginx/certs

# Expose HTTP and HTTPS ports
EXPOSE 80 443

# Run NGINX in the foreground
CMD ["nginx", "-g", "daemon off;"]
