FROM node:7.7.3-alpine

COPY . /src
WORKDIR /src

RUN npm install --production

RUN touch /var/log/autoscaler

CMD ["node", "/src/index.js"]    
