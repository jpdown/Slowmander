# syntax=docker/dockerfile:1

FROM node:16-alpine as builder
WORKDIR /app
COPY "package*.json" ./
RUN apk update && apk add python3 g++ make
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine as node_modules
WORKDIR /app
COPY package*.json ./
RUN apk update && apk add python3 g++ make
RUN npm ci --only=production

FROM node:16-alpine
ENV NODE_ENV=production
ENV NODE_PATH=/app/dist
ENV SLOWMANDER_DATA_PATH=/data
VOLUME [ "/data" ]
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=node_modules --chown=node:node /app/node_modules ./node_modules
CMD [ "node", "dist/Bot.js" ]