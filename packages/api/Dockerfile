FROM node:18 as builder

WORKDIR /app
COPY . .
RUN	yarn install --immutable --ignore-scripts
RUN yarn run prepare:lerna
RUN cd packages/www && yarn run static
RUN cd packages/api && yarn run esbuild

FROM node:18

WORKDIR app
COPY --from=builder /app/packages/api/dist-esbuild/livepeer-api /usr/local/bin/livepeer-api
ENV NODE_ENV production
ARG	VERSION
ENV	VERSION ${VERSION}
ARG	GITHUB_SHA
ENV	GITHUB_SHA ${GITHUB_SHA}
ENV	LP_API_PORT 80
RUN /usr/local/bin/livepeer-api --help
ENTRYPOINT ["/usr/local/bin/livepeer-api"]
