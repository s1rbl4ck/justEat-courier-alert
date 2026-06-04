FROM oven/bun:1

WORKDIR /usr/src/app

# Copy lockfile and manifests first for better layer caching.
COPY package.json bun.lock ./

# Install dependencies using Bun to match the repository lockfile.
RUN bun install --frozen-lockfile

# Download the Camoufox browser binary needed at runtime.
RUN bunx camoufox fetch

# Copy the application source.
COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the TypeScript server directly with Bun.
CMD ["bun", "server.ts"]
