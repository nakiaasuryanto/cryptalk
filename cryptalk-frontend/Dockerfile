FROM node:22.12.0-slim

WORKDIR /app

# Build-time args
ARG PUBLIC_API_URL
ARG PUBLIC_FRONTEND_URL

# Set as env vars for build
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_FRONTEND_URL=$PUBLIC_FRONTEND_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Railway uses dynamic PORT
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
