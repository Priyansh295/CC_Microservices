FROM nginx:latest

# Copy our custom nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Remove the default configuration to avoid conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check for container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
