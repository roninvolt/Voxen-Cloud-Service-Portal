# ==========================================
# Voxen Cloud Services Frontend Production Dockerfile
# Serves optimized production build via Nginx
# ==========================================

FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets
COPY dist /usr/share/nginx/html

# Copy custom Nginx configuration with client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
