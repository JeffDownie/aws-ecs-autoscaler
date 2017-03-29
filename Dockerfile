FROM node:7.7.3-alpine

COPY . /src
WORKDIR /src

RUN npm install --production

ENTRYPOINT ["node", "/src/index.js"]
