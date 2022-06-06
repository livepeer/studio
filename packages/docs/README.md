# Livepeer Studio Docs

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern
static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window.
Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be
served using any static contents hosting service.

### Regenerate Algolia Index

If you have not already installed
[jq](https://github.com/stedolan/jq/wiki/Installation), please do so.

In `.env.docsearch`, replace the placeholder API key with a key that has write
access to the appropriate Algolia application.

Next, navigate to the folder root, then run:

```
docker run -it --env-file=.env.docsearch -e "CONFIG=$(cat docsearch.config.json | jq -r tostring)" algolia/docsearch-scraper
```
