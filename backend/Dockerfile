FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL deps (need tsx to run TS)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port (App Runner uses 8080 by default)
EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["npx", "tsx", "src/index.ts"]
