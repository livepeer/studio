FROM	node:16	as	builder
WORKDIR	/app

ENV	NODE_ENV development

COPY	packages/api/package.json	yarn.lock	./
RUN	yarn install --ignore-scripts --frozen-lockfile

COPY	packages/api/tsconfig.json	.
COPY	packages/api/src	src
RUN	yarn run prepare

FROM	node:16
WORKDIR /app

ENV	NODE_ENV production

COPY	packages/api/package.json yarn.lock ./
RUN	yarn install --frozen-lockfile
COPY --from=builder	/app/dist	dist

ARG	VERSION
ENV	VERSION ${VERSION}
ARG	GITHUB_SHA
ENV	GITHUB_SHA ${GITHUB_SHA}

RUN	node dist/cli.js --help

ENV	LP_API_PORT 80
ENTRYPOINT ["node", "dist/cli.js"]
