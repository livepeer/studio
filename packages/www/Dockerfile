FROM	node:14

WORKDIR	/app

COPY	package.json yarn.lock lerna.json	./

RUN	yarn install --frozen-lockfile

COPY	.	.

WORKDIR /app/packages/www

CMD	["yarn", "run", "start"]
