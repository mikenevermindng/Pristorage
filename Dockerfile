# Install dependencies only when needed
FROM rust:1.31
FROM node:14
ENV TZ="Asia/Ho_Chi_Minh"

WORKDIR /app

RUN rustup target add wasm32-unknown-unknown
RUN npm i -g npm@latest
RUN npm install --global pm2

COPY package*.json /app/

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 1234

USER node

CMD ["pm2-runtime", "npm", "--", "start"]