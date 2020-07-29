# Livepeer.com

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Packages](#packages)

## Requirements

This project requires `node >=10.0.0` and `yarn >=1.0.0`. A unix shell is also required.

- [Installing Node](https://docs.npmjs.com/getting-started/installing-node)
- [Installing Yarn](https://yarnpkg.com/lang/en/docs/install/)
- [UNIX Shell (Windows users)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

## Getting Started

To get started, clone the repo and install its dependencies:

```bash
git clone https://github.com/livepeer/livepeer.com.git
cd livepeer.com
yarn
```

For development purposes there's a top-level `dev` script that will watch and continuously compile all packages concurrently:

```bash
yarn dev
```

For next steps, take a look at documentation for the individual package(s) you want to run and/or develop.

## Contributing

Thanks for your interest in Livepeer.com. There are many ways you can contribute. To start, take a few minutes to look over the official guide:

**[Read the "Contributing to livepeer.com" Guide &raquo;](https://github.com/livepeer/livepeer.com/blob/master/CONTRIBUTING.md)**

We happily await your pull requests and/or involvement in our [issues page](https://github.com/livepeer/livepeer.com/issues) and hope to see your username on our [list of contributors](https://github.com/livepeer/livepeer.com/graphs/contributors) 🎉🎉🎉

## Packages

### Private

| Name                                                                                          | Description                               |
| --------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`@livepeer.com/api`](https://github.com/livepeer/livepeer.com/tree/master/packages/api)      | Livepeer API node for controlling streams |
| [`@livepeer.com/www`](https://github.com/livepeer/livepeer.com/tree/master/packages/subgraph) | The livepeer.com frontend                 |
| [`@livepeer.com/admin`](https://github.com/livepeer/livepeer.com/tree/master/packages/admin)  | The livepeer.com Sanity CMS               |
