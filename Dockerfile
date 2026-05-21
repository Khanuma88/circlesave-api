FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN node node_modules/prisma/build/index.js generate

EXPOSE 3001

CMD ["node", "src/server.js"]