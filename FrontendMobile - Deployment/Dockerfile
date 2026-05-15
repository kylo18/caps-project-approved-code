FROM nginx:alpine

# Copy pre-built static files
COPY dist/ /usr/share/nginx/html/

# Copy nginx config to serve React Router SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]