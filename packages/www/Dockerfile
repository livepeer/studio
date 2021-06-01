FROM node:16

RUN npm install -g serve
WORKDIR /www
ADD out .
CMD serve -s
