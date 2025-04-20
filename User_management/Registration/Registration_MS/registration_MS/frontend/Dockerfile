# Dockerfile for Frontend (React/Vite) - Multi-stage build

# ---- Stage 1: Build ----
# Use a Node.js image to install dependencies and build the React app
FROM node:18-alpine as build-stage
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm install

# Copy the rest of the application source code into the container
# Ensure you have a .dockerignore file in the frontend directory
COPY . .

# Build the React application for production
# The output directory for Vite is typically 'dist'. Verify in your package.json if needed.
RUN npm run build

# ---- Stage 2: Serve ----
# Use a lightweight Nginx image to serve the static production build
FROM nginx:stable-alpine as production-stage

# Copy the static assets from the 'build-stage' into Nginx's default public html directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# IMPORTANT: If you add client-side routing (like React Router) later,
# you will likely need to add a custom nginx.conf file here to handle routing correctly.
# Example: COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80, the default port Nginx listens on
EXPOSE 80

# The default command for the nginx image is to start the server.
# This command keeps Nginx running in the foreground.
CMD ["nginx", "-g", "daemon off;"]