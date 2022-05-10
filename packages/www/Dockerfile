# To be run from the root of the repository so that we can pick up other packages

FROM node:14

WORKDIR /app
ADD package.json package.json
ADD yarn.lock yarn.lock
ADD lerna.json lerna.json
ADD . .
RUN yarn install --frozen-lockfile
WORKDIR /app/packages/www
CMD yarn run start
