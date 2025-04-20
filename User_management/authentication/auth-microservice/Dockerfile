FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies required for bcrypt
RUN apk add --no-cache make gcc g++ python3

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Clean up build dependencies to reduce image size
RUN apk del make gcc g++ python3

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "src/server.js"]