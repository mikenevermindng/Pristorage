# Install dependencies only when needed
FROM ubuntu:latest
FROM node:14
ENV TZ="Asia/Ho_Chi_Minh"

WORKDIR /app
RUN apt-get update && \
    apt-get install -y curl
RUN curl https://sh.rustup.rs -sSf > rustup.sh
RUN chmod 755 rustup.sh
RUN ./rustup.sh -y
RUN rm /app/rustup.sh
RUN npm i -g npm@latest
RUN npm install --global pm2

COPY package*.json /app/

RUN npm install

COPY . /app

RUN npm run build

EXPOSE 1234

USER node

CMD ["pm2-runtime", "npm", "--", "start"]