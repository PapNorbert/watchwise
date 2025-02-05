FROM node:20-alpine

WORKDIR /app

COPY . .

RUN rm -rf package-lock.json

RUN ls

RUN npm install  && \
    npm cache clean --force
    
RUN npm list -g

EXPOSE 3000

CMD ["node", "main.js"]
