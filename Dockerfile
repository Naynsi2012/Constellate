# Build the Vite/React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/Frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci --include=dev
COPY Frontend/ ./
RUN npm run build

# Run Express + Socket.IO and serve the built frontend from the same origin
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN npm ci --omit=dev --prefix Backend
COPY Backend/ ./Backend/
COPY --from=frontend-build /app/Frontend/dist ./Frontend/dist
EXPOSE 8080
CMD ["node", "Backend/server.js"]
