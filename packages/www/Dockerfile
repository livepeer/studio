FROM	node:18

WORKDIR	/app

COPY	package.json yarn.lock lerna.json	./

COPY	.	.

RUN	yarn install --frozen-lockfile

WORKDIR /app/packages/www

CMD	["yarn", "run", "start"]
