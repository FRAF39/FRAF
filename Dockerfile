FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
ENV RENDER=true
ENV DB_PATH=/var/data/data.db
EXPOSE 10000
CMD ["npm","start"]
