# syntax=docker/dockerfile:1

FROM node:16-alpine as builder
WORKDIR /app
COPY "package*.json" ./
RUN apk update
RUN apk add python3 g++ make
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine
ENV NODE_ENV=production
ENV NODE_PATH=/app/dist
WORKDIR /app
COPY package*.json ./
RUN apk update
RUN apk add python3 g++ make
RUN npm install --production
RUN apk del python3 g++ make
COPY --from=builder /app/dist ./dist
CMD [ "node", "dist/Bot.js" ]