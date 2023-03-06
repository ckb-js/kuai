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
