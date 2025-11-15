# === Stage 1: Build ===
# Use the official Node.js 20 image as the base
FROM --platform=linux/amd64 node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install dependencies (use npm ci for reproducible builds)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# === Stage 2: Production ===
# Use a minimal node image for the final container
FROM node:20-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy the standalone output
COPY --from=build /app/.next/standalone ./

# Copy the public folder
COPY --from=build /app/public ./public

# Copy the static assets
COPY --from=build /app/.next/static ./.next/static

# Expose the port Next.js will run on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]