FROM node:20-bullseye as builder
WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Fix heap out-of-memory issue by increasing memory limit for Node.js
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Serve the built files with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean up default nginx 50x error page (optional)
RUN rm -rf /usr/share/nginx/html/50x.html

EXPOSE 80
