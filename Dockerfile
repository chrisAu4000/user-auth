FROM node:boron

ENV APP_DIR /app

RUN mkdir $APP_DIR
WORKDIR $APP_DIR

COPY package.json $APP_DIR/
RUN npm install

COPY . $APP_DIR
