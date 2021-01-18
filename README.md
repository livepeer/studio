# Livepeer.com

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Packages](#packages)

## Requirements

This project requires `node >=10.0.0` and `yarn >=1.0.0`. A unix shell is also
required.

- [Installing Node](https://docs.npmjs.com/getting-started/installing-node)
- [Installing Yarn](https://yarnpkg.com/lang/en/docs/install/)
- [UNIX Shell (Windows users)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

## Local Development

### Step 1

If you're a member of the `livepeer-com` vercel team run
`vercel env pull .env.local` to fetch the development environment vars. If not,
copy the .env.local.example file in this directory, rename it to .env.local
(which will be ignored by Git) and add your local env vars

`cp .env.local.example .env.local`

### Step 2

Install it and run:

```bash
yarn
yarn dev
```

## Sanity CMS

The Sanity CMS can be accessed locally by visiting `http://localhost:3333/admin`
or https://livepeer.sanity.studio. If you've made changes to the Sanity schema
and would like to deploy theem to production run `yarn deploy` inside the
`packags/admin` (you'll need to be authenticated with Sanity to deploy changes
to prod).

## Deploying

Deployments are run automatically via
[Vercel's github integration](https://vercel.com/docs/git-integrations/vercel-for-github).

## Contributing

Thanks for your interest in Livepeer.com. There are many ways you can
contribute. To start, take a few minutes to look over the official guide:

**[Read the "Contributing to livepeer.com" Guide &raquo;](https://github.com/livepeer/livepeer.com/blob/master/CONTRIBUTING.md)**

We happily await your pull requests and/or involvement in our
[issues page](https://github.com/livepeer/livepeer.com/issues) and hope to see
your username on our
[list of contributors](https://github.com/livepeer/livepeer.com/graphs/contributors)
🎉🎉🎉

## Packages

### Private

| Name                                                                                          | Description                              |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [`@livepeer.com/api`](https://github.com/livepeer/livepeer.com/tree/master/packages/api)      | Livepeer.com API for controlling streams |
| [`@livepeer.com/www`](https://github.com/livepeer/livepeer.com/tree/master/packages/subgraph) | The livepeer.com frontend                |
| [`@livepeer.com/admin`](https://github.com/livepeer/livepeer.com/tree/master/packages/admin)  | The livepeer.com Sanity CMS              |
