# To be run from the root of the repository so that we can pick up design-system too

FROM node:12

WORKDIR /app
ADD package.json package.json
ADD lerna.json lerna.json
ADD . .
RUN yarn install
WORKDIR /app/packages/www
CMD yarn run start
