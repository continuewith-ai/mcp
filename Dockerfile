FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY bin ./bin
COPY src ./src
# Install runtime deps declared in package.json
RUN npm install --omit=dev
CMD ["node", "bin/continuewith-mcp.js"]
