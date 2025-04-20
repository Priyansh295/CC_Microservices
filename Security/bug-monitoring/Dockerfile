FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p logs && chmod 777 logs
EXPOSE 4003
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
