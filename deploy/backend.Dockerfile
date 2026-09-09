FROM node:22.20-bookworm-slim
ARG BUILD_SHA=unknown
ENV NODE_ENV=production BUILD_SHA=${BUILD_SHA}
WORKDIR /app/apps/backend
COPY apps/backend/package.json apps/backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY apps/backend/src ./src
COPY apps/backend/scripts ./scripts
COPY apps/backend/sandbox ./sandbox
COPY challenges /app/challenges
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 4001 4002
CMD ["node", "src/server.js"]
