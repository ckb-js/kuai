# kuai

A protocol and framework for building universal dapps on Nervos CKB

# Getting started

## Clone this project locally

```sh
$ git clone https://github.com/ckb-js/kuai.git
```

## Install Dependencies

`Kuai` uses [lerna](https://lerna.js.org/) to manage dependencies

```sh
# use lerna to install dependencies, run `npx lerna bootstrap --hoist` under the hood
$ npm run bootstrap
```

## Build pacakges

```sh
# use lerna to run tasks defined in packages, run `lerna run build` under the hood
$ npm run build
```

Outputs will be built in the `lib` directory in their own workspaces

## Demos

[MVP DApp](./packages/samples/mvp-dapp)

## Quick start

#### Environment

    node >= 18

#### Kuai Installation

First, install `kuai` globally by `npm link`:

```bash
$ git clone git@github.com:ckb-js/kuai.git

$ cd kuai

$ yarn bootstrap

$ yarn build

$ cd packages/cli

$ npm link
```

#### Create a template project using the command.

```bash
kuai init
```

#### Running

`kuai` has `dev` and `prod` modes

dev

```bash
npm run dev
```

prod

```bash
npm run build
npm run start:prod
```

#### Others commands

run test

```bash
npm run test
```

build docs

The docs is build by [typedoc](https://typedoc.org/), `typedoc.json` is the build configuration.

```bash
npm run doc
```
