FROM node:20-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Install dependencies (cache-friendly)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy necessary files for pull
COPY data/ ./data/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Pull challenge tiles at build time
RUN node scripts/pull_challs.js

# Copy rest
COPY . .

EXPOSE 6958

CMD ["node", "app.js"]
