FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN node node_modules/prisma/build/index.js generate

COPY start.sh .
RUN chmod +x start.sh

EXPOSE 3001

CMD ["./start.sh"]