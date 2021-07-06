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

ARG DOCKER_TAG
ENV DOCKER_TAG ${DOCKER_TAG}
ARG GITHUB_SHA
ENV GITHUB_SHA ${GITHUB_SHA}

ADD packages/api/package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY --from=builder /app/dist dist

ENV LP_PORT 80
ENTRYPOINT ["node", "dist/cli.js"]
