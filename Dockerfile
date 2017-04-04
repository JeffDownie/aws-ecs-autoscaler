FROM node:7.7.3-alpine

COPY . /src
WORKDIR /src

RUN npm install --silent --production

CMD ["node", "/src/index.js"]    
