FROM node:7.7.3-alpine

COPY . /src
WORKDIR /src

RUN npm install --silent --production

CMD ["node", "--expose-gc" , "/src/index.js"]
