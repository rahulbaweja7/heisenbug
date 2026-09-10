FROM node:22.20-bookworm-slim@sha256:c385ec44d77c785e2364ac0c9b150809a0fdc17fde3dbf061e3dad07242c6a85

ARG BUILD_SHA=unknown
ENV NODE_ENV=production \
    BUILD_SHA=${BUILD_SHA} \
    PORT=4001 \
    PREVIEW_PORT=4002 \
    DATABASE_PATH=/data/heisenbug.sqlite

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
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4001/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
