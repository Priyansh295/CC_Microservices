# Dockerfile for Backend (Node.js/Express)

# 1. Base Image: Use an official Node.js runtime.
# Using Alpine variant for smaller image size. Node 18 is a good LTS choice.
FROM node:18-alpine

# 2. Working Directory: Set the working directory inside the container.
WORKDIR /usr/src/app

# 3. Copy package files: Copy package.json and package-lock.json (or yarn.lock).
# Copying these first leverages Docker layer caching.
COPY package*.json ./

# 4. Install Dependencies: Install production dependencies using npm ci (clean install based on lock file).
# Use --only=production to avoid installing devDependencies (like nodemon) in the final image.
RUN npm ci --only=production

# 5. Copy Application Code: Copy the rest of your application source code.
# Ensure you have a .dockerignore file to avoid copying node_modules etc.
COPY . .

# 6. Expose Port: Inform Docker that the container will listen on this port at runtime.
# Make sure this matches the PORT in your .env or server.js default (3001).
EXPOSE 3001

# 7. Run Command: Define the command to run your application.
CMD [ "node", "server.js" ]