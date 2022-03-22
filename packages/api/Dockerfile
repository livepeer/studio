FROM node:16 as builder
WORKDIR /app

ENV NODE_ENV development

ADD packages/api/package.json yarn.lock ./
RUN yarn install --ignore-scripts --frozen-lockfile

ADD packages/api/tsconfig.json .
ADD packages/api/src src
RUN yarn run prepare

FROM node:16
WORKDIR /app

ENV NODE_ENV production

ADD packages/api/package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY --from=builder /app/dist dist

ARG VERSION
ENV VERSION ${VERSION}
ARG GITHUB_SHA
ENV GITHUB_SHA ${GITHUB_SHA}

RUN node dist/cli.js --help

ENV LP_API_PORT 80
ENTRYPOINT ["node", "dist/cli.js"]
