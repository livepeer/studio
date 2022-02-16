SHELL=/bin/bash

all: build start dev clean release

.PHONY: build
build:
	yarn run build

.PHONY: start
start:
	yarn run start

.PHONY: dev
dev:
	yarn run dev

.PHONY: clean
clean:
	yarn run clean

.PHONY: release
release:
	yarn run release
