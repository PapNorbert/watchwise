FROM node:20-alpine

WORKDIR /app

COPY . .

RUN rm -rf package-lock.json

RUN npm install && \
    npm cache clean --force

EXPOSE 3800

CMD ["sh", "-c", "set PORT=3800 && npm start"]
