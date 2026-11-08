# Pin Node 20: jsonwebtoken → jwa → buffer-equal-constant-time breaks on Node 25+
FROM node:20-bookworm
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
CMD ["npm", "start"]
