FROM node:18 as builder

WORKDIR /app
COPY . .
RUN	yarn install --frozen-lockfile --ignore-scripts
RUN yarn run prepare:lerna
RUN cd packages/api && yarn run pkg:local

FROM ubuntu:22.04

WORKDIR app
COPY --from=builder /app/packages/api/bin/api /usr/local/bin/livepeer-api
ENV NODE_ENV production
ARG	VERSION
ENV	VERSION ${VERSION}
ARG	GITHUB_SHA
ENV	GITHUB_SHA ${GITHUB_SHA}
RUN /usr/local/bin/livepeer-api --help
ENTRYPOINT ["/usr/local/bin/livepeer-api"]
