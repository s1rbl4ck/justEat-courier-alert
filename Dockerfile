FROM node:20-alpine

WORKDIR /usr/src/app

# Install build tools (some npm packages need them)
RUN apk add --no-cache python3 make g++

# Copy package manifests first for better caching
COPY package*.json ./

# Install all dependencies (including dev deps which may include tsx)
RUN npm ci --silent

# Copy app sources
COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run the app using tsx (installed in node_modules)
CMD ["npx", "tsx", "server.ts"]
