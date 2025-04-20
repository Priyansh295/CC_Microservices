# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set build arguments with default values
ARG REACT_APP_AUTH_API_URL=http://localhost/api/auth
ARG REACT_APP_RBAC_API_URL=http://localhost/api/rbac

# Set environment variables for the build
ENV REACT_APP_AUTH_API_URL=${REACT_APP_AUTH_API_URL}
ENV REACT_APP_RBAC_API_URL=${REACT_APP_RBAC_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create a custom nginx config for React routing
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]