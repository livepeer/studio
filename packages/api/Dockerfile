FROM node:16 as base

WORKDIR /app
RUN npm install -g --force yarn

FROM base as builder

ENV NODE_ENV development

ADD package.json .
RUN yarn install --ignore-scripts --frozen-lockfile

ADD tsconfig.json .
ADD src src
RUN yarn run prepare

FROM base

ENV NODE_ENV production

ARG DOCKER_TAG
ENV DOCKER_TAG ${DOCKER_TAG}
ARG GITHUB_SHA
ENV GITHUB_SHA ${GITHUB_SHA}

ADD package.json .
RUN yarn install --frozen-lockfile
COPY --from=builder /app/dist dist

ENV LP_PORT 80
ENTRYPOINT ["node", "dist/cli.js"]
