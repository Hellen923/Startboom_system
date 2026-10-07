FROM node:22-bookworm-slim AS frontend
RUN npm install -g npm@11.7.0 --no-audit --no-fund
WORKDIR /build
COPY startboom-digital/frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY startboom-digital/frontend/ ./
ENV REACT_APP_API_URL=/api
ENV REACT_APP_NAME="CoreMint CRM"
RUN npm run build

FROM node:22-bookworm-slim AS runtime
RUN npm install -g npm@11.7.0 --no-audit --no-fund
ENV NODE_ENV=production PORT=5000 SERVE_FRONTEND=true
WORKDIR /app/backend
COPY startboom-digital/backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --chown=node:node startboom-digital/backend/ ./
COPY --from=frontend --chown=node:node /build/build /app/frontend/build
RUN mkdir -p uploads logs public && chown -R node:node uploads logs public
USER node
EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=6 CMD node -e "fetch('http://127.0.0.1:5000/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
