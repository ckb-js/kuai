<p align="center">
  <img src="https://github.com/ckb-js/kuai/assets/7271329/f128229c-950d-45e8-85f5-c937c04aee9b" alt="Kuai Logo" width="120" />
</p>

# Overview

**Kuai** is an application development **philosophy** and all-in-one development **framework** designed specifically for Nervos CKB. It encompasses generic application development **patterns**, convenient development **scaffolding**, plug-and-play application **architecture**, and development **manuals** to facilitate development processes.

# Design Philosophy

The cell model of CKB is a generalization of Bitcoin's [UTXO model](https://en.wikipedia.org/wiki/Unspent_transaction_output) and naturally has the ability to execute in parallel. Inspired by the [Actor model](https://en.wikipedia.org/wiki/Actor_model), the Kuai project abstracts a group of cells into an actor based on patterns. Actors communicate with each other through message passing, which enables efficient parallel execution of multiple actors and improves the interoperability from module level to application level. This design facilitates the development of highly concurrent and scalable applications.

Read [Kuai Proposal](https://github.com/ckb-js/topics/blob/add-draft-of-kuai-proposal/README.md) for more details on the design.

# Modules

## [@kuai/cli](https://github.com/ckb-js/kuai/tree/develop/packages/cli)

kuai-cli maps kuai's task system to a unix command-line interface and executes it, providing additional commands such as help

### how to use this module

build or download kuai-cli

- Build locally

```bash
$ git clone git@github.com:ckb-js/kuai.git
$ npm i
$ npx lerna run build
$ npx link ./packages/cli
```

### Built-in commands list

- kuai test

```bash
# kuai test [options]

# Options:
#   --projectRootPath [path]    The Root of testing project (default: "")
#   -h, --help                  display help for command
```

- kuai node

```bash
# start
# kuai node [options] start

# Options:
#   --port [number]            port number (default: 8114)
#   --detached                 run in backend (default: false)
#   --genesisArgs [string...]  The genesis args
#   -h, --help                 display help for command
```

```bash
# close
$ kuai node close
```

- kuai init

```bash
# kuai init [options]

# Options:
#   -h, --help                 display help for command
```

- kuai build

```bash
# Usage: kuai build [options] [command]

# build the dapp

# Options:
#   --server    Build Server (default: true)
#   -h, --help  display help for command

# Commands:
#   dev         build server side application in dev mode
#   server      build server side application
```

- Kuai contract
  [TODO]
- kuai contract deploy

```bash
# Usage: kuai contract deploy [options]

# Options:
#   --name [string]      name of the contract to be deployed (default: "")
#   --bin-path [path]    path of contract bin file (default: "")
#   --from <string...>   address or multisig config of the contract deployer (default: "")
#   --signer [string]    signer provider [default: ckb-cli] [possible values: ckb-cli, ckb-cli-multisig]
#                        (default: "")
#   --fee-rate [number]  per transaction's fee, deployment may involve more than one transaction. default:
#                        [1000] shannons/Byte (default: 1000)
#   --export [path]      export transaction to file (default: "")
#   --send               send transaction directly (default: false)
#   --no-type-id         not use type id deploy
#   -h, --help           display help for command
```

- kuai contract sign-message

```bash
# Usage: kuai contract sign-message [options]

# Options:
#   --message <string>  message to be signed (default: "")
#   --address <string>  the address of message signer (default: "")
#   --prefix [string]   the prefix of signature (default: "")
#   --signer [string]   signer provider [default: ckb-cli] [possible values: ckb-cli, ckb-cli-multisig]
#                       (default: "ckb-cli")
#   -h, --help          display help for command
```

- kuai contract build

```bash
# Usage: kuai contract build [options]

# Options:
#   --name [string]  contract name (default: "")
#   --release        build contracts in release mode (default: false)
#   -h, --help       display help for command
```

- kuai contract new

```bash
# Usage: kuai contract new [options]

# Options:
#   --name <string>      The name of new contract
#   --template [string]  language template  [default: rust]  [possible values: rust, c, c-sharedlib]
#                        (default: "rust")
#   -h, --help           display help for command
```

- Kuai signer
  [built-in signer]
- kuai signer account-list

```bash
# Usage: kuai signer account-list [options]

# list accounts of built-in signer

# Options:
#   --console   console output (default: false)
#   -h, --help  display help for command
```

- kuai signer account-new

```bash
# Usage: kuai signer account-new [options]

# create new account for built-in signer

# Options:
#   --password <string>  The password of account
#   --console            console output (default: false)
#   -h, --help           display help for command
```

- kuai signer account-import

```bash
# Usage: kuai signer account-import [options]

# import an unencrypted private key from <privkey-path> and create a new account.

# Options:
#   --privkey-path <string>           The privkey is assumed to contain an unencrypted private key in
                                    hexadecimal format. (only read first line)
#   --password [string]               The Password to lock your account (default: "")
#   --extended-privkey-path <string>  Extended private key path (include master private key and chain
                                    code)
#   --console                         console output (default: false)
#   -h, --help                        display help for command
```

- kuai signer account-export

```bash
# Usage: kuai signer account-export [options]

# export master private key and chain code as hex plain text (USE WITH YOUR OWN RISK)

# Options:
#   --lock-arg <string>               Lock argument (account identifier, blake2b(pubkey)[0..20])
#   --password [string]               The Password for unlock your account (default: "")
#   --extended-privkey-path <string>   Output extended private key path (PrivKey + ChainCode)
#   --console                         console output (default: false)
#   -h, --help                        display help for command
```

## [@kuai/common](https://github.com/ckb-js/kuai/tree/develop/packages/common)

The common module provides a set of common utility functions and helpers that are used throughout the Kuai repository.
**[what is this module]** @zhengjianhui
**[how to use this module]** @zhengjianhui

## [@kuai/core](https://github.com/ckb-js/kuai/tree/develop/packages/core)

The core module exposes the core functionalities for building decentralized applications on Nervos CKB. It includes tasks to create projects in generic development patterns and a universal architecture, to launch a local devnet chain, to run tests in a general manner, to deploy applications smoothly.

### how to use this module

1. define built-in kuai project templates at https://github.com/ckb-js/kuai/tree/develop/packages/core/sample-projects, these templates are used to initialize a DApp;
2. define tasks at https://github.com/ckb-js/kuai/tree/develop/packages/core/src/builtin-tasks to enhance [kuai-cli](https://github.com/ckb-js/kuai/tree/develop/packages/cli), it includes basic steps to build a DApp, e.g. `build for various modes`, `develop&deploy a contract`, `start devnet locally`, `run tests in a generalized manner`;
3. export base class of ContractDeployer at https://github.com/ckb-js/kuai/blob/develop/packages/core/src/contract.ts for extension;
4. define scripts metadata of devnet at https://github.com/ckb-js/kuai/blob/develop/packages/core/src/util/chain.ts, `dao`, `secp256k1_blake160`, and `secp256k1_blake160_multisig` are set by default;
5. wrap [ckb-cli](https://github.com/nervosnetwork/ckb-cli) at https://github.com/ckb-js/kuai/blob/develop/packages/core/src/ckb-cli.ts to provide a universal development experience(DX);
6. define default networks at https://github.com/ckb-js/kuai/blob/develop/packages/core/src/constants.ts;

## [@kuai/docker-node](https://github.com/ckb-js/kuai/tree/develop/packages/docker-node)

The docker-node module provides a Docker image for running a Nervos CKB node in a containerized environment. It includes all the necessary dependencies and configuration files.

### how to use this module

```ts
import { CkbDockerNetwork } from '@ckb-js/kuai-docker-node'

const ckbDockerNetwork = new CkbDockerNetwork()

// start ckb-node
await ckbDockerNetwork.start({
  port: 3000, //
  detached: true, //  Whether to run in the background
  genesisAccountArgs: ['0x0000000000000000000000000000000000000000', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'], // Initial account on the chain
})

// stop ckb-node
await ckbDockerNetwork.stop()
```

## [@kuai/io](https://github.com/ckb-js/kuai/tree/develop/packages/io)

The IO module defines interfaces of applications for various use cases. It includes functions to encode/decode input and output data.

The IO module contains several parts

- cor is a chain of responsibility implementation with two methods, `use` and `dispatch`
  using `use` adds middleware to `cor`, and when using `dispacth`, the incoming arguments are processed through each middleware

- router
  `Router` is a `cor` middle built into `kuai/io` that provides the ability to find and execute a specific middleware based on a path, and is often used to implement restful interfaces

- adapter
  Adapter is `kuai/io` built-in and other http framework compatible adapter, currently supports `koaAdapter`

- listener
  Listener is used to periodically rotate the data on the chain and return a `rxjs` Observable

## how to use this module

- cor

```ts
import { CoR } from '@ckb-js/kuai-io'

const cor = new CoR()

const mockFn = console.log('mockFn')
const mockFn1 = console.log('mockFn1')
const mockFn2 = console.log('mockFn2')

cor.use(async (_, next) => {
  mockFn()
  await next()
})

cor.use(async (ctx) => {
  mockFn1()
  ctx.ok('ok')
})

cor.use(async (_, next) => {
  mockFn2()
  await next()
})

await cor.dispatch({})
// print
// mockFn
// mockFn2
```

- router

```ts
import { CoR, KuaiRouter } from '@ckb-js/kuai-io'

const cor = new CoR()
const kuaiRouter = new KuaiRouter()
kuaiRouter.get('/', async (ctx) => {
  ctx.ok('hello root')
})

kuaiRouter.get('/parent', async (ctx) => {
  ctx.ok('hello parent')
})

kuaiRouter.get('/parent/children', async (ctx) => {
  ctx.ok('hello children')
})

cor.use(kuaiRouter.middleware())

const rootResult = await cor.dispatch({ method: 'GET', path: '/' })
// hello root

const parentResult = await cor.dispatch({ method: 'GET', path: '/parent' })
// hello parent

const childrenResult = await cor.dispatch({ method: 'GET', path: '/parent/children' })
// hello children
```

- adapter

```ts
import { CoR, KuaiRouter } from '@ckb-js/kuai-io'

const koaServer = new Koa()
koaServer.use(koaBody())

const cor = new CoR()
const kuaiRouter = new KuaiRouter()
kuaiRouter.get('/', async (ctx) => {
  ctx.ok('hello root')
})

kuaiRouter.get('/parent', async (ctx) => {
  ctx.ok('hello parent')
})

kuaiRouter.get('/parent/children', async (ctx) => {
  ctx.ok('hello children')
})

cor.use(kuaiRouter.middleware())
const koaRouterAdapter = new KoaRouterAdapter(cor)
koaServer.use(koaRouterAdapter.routes())
const server = koaServer.listen(4004)

const res = await fetch('http://localhost:4004/', { method: 'GET' })
console.log(res.status) // 200
const body = await res.text()
console.log(body) // hello root

const res = await fetch('http://localhost:4004/parent', { method: 'GET' })
console.log(res.status) // 200
const body = await res.text()
console.log(body) // hello parent

const res = await fetch('http://localhost:4004/parent/children', { method: 'GET' })
console.log(res.status) // 200
const body = await res.text()
console.log(body) // hello children
```

## [@kuai/models](https://github.com/ckb-js/kuai/tree/develop/packages/models)

This codebase provides a set of data models for working with the Nervos CKB blockchain. It includes models for blocks, transactions, and cells, among others.

### [resource-binding](https://github.com/ckb-js/kuai/tree/develop/packages/models/src/resource-binding)

Resource binding is a built-in module that serves the purpose of connecting on-chain data with off-chain data. Once the DApp is launched, resource binding synchronizes the data based on pre-defined rules. Whenever there is a change in on-chain data, resource binding promptly updates the off-chain model.

### How to use the resource binding?

#### Initiate the resource binding when bootstrap

First, the resource binding module is a pluggable module that can be utilized by declaring it in the entry file. We provide a function which can help to initialize the resource binding as follow.

```typescript
import {initiateResourceBindingManager } from '@ckb-js/kuai-models'
import { TipHeaderListener, NervosChainSource } from '@ckb-js/kuai-io'

async function bootstrap() {
  ...
  const dataSource = new NervosChainSource(kuaiEnv.config.ckbChain.rpcUrl)
  initiateResourceBindingManager(dataSource, new TipHeaderListener(dataSource))
  ...
}
```

For this, we provider the default `listener` and the default `data source` in `kuai-io` module, you can find the import as above.

#### Define `store` with decorators

We provider several decorators to help to register the `store` to resource binding, here is one example to use these decorators as below.

```typescript
import { ActorProvider, DataPattern, LockPattern, Omnilock } from '@ckb-js/kuai-models'

@ActorProvider({ ref: { name: 'omnilock', path: `/:args/` } })
@LockPattern()
@DataPattern('0x')
@Omnilock()
class OmnilockModel extends JSONStore<Record<string, never>> {
  constructor() {
    @Param('args') args: string,
    ...
  }

  ...
}
```

##### Register

`kuai` should know which `store` should be connected to the chain, so the `store` should be registered to the `kuai`. We provider a decorator `ActorProcider` to achieve this. The `name` defined in `ref` is to register to the `Registry` with the `store`, and the parameters in `path` is used to inject to the `constructor` as defined in `Param` decorator.

##### Lock

As in nervos network, each cell has its own `lock script`, so the `lock script` should be defined in `store`. We provide two default lock decorators, the `Omnilock` and the `Secp256k1Lock`, to use to define the most used `lock script`s in nervos network, and if you are using other `lock script`s in system, the `DefaultLock` could be used. Also we provide the `Lock` decorator for you to define your custom `lock script`.

The Lock decorators we provided as below.

- `Lock`
- `DefaultLock`
- `Omnilock`
- `Secp256k1Lock`

##### Filter

`kuai` should know which cell should be connected to the `store`, filter data of them from chain. We provide several decorator for you to do this.

- `LockPattern`: Filter the lock to equal to the `lockscript` of `store` defined.
- `DataPattern`: It has one parameter means data, filter the data in cell to equal to the parameter.
- `DataPrefixPattern`: It has one parameter means data prefix, filter the data to start with the parameter.

### [store](https://github.com/ckb-js/kuai/tree/develop/packages/models/src/store)

The store extends from Actor, uses to subscribe data on the ckb chain and transform it to locally structured data, then change them and submit to the ckb chain.

Supported storage location: data, witness, lock.args, type.args.

Supported transform methods: JSON and molecule

Supported types for JSON Store: string, array, object, reference[ packages/models/src/store/json-storage.ts](https://github.com/ckb-js/kuai/blob/5586346f21b677dcc3ddc4d24948a17d6ea9cb33/packages/models/src/store/json-storage.ts#L5-L11)

Supported types for molecule store: string, number, [BI](https://github.com/ckb-js/lumos/tree/develop/packages/bi), array, object, Supported molecule types: array, struct, vec, table, option, union. reference [molecule-storage](https://github.com/ckb-js/kuai/blob/4558a98f7188769830e62e14ecbbce9a2d8dbdde/packages/models/src/store/molecule-storage.ts#L55-L62C1)

### How to use this module

Defined JSONStore and MoleculeStore to handle JSON data or molecule data.

- Create a new `Store`:

  - For JSON with `JSONStore`:

  ```typescript
  type Data = {
    field1: string
    field2: string
    field3: string
  }
  export class NewJSONStore extends JSONStore<{ data: Data }> {
    constructor(
      _schemaOption?: { data: true },
      params?: {
        states?: Record<OutPointString, { data: Data }>
        chainData?: Record<OutPointString, UpdateStorageValue>
        cellPattern?: CellPattern
        schemaPattern?: SchemaPattern
      },
    ) {
      super({ data: true }, params)
    }
  }
  ```

  - For molecule with `MoleculeStore`:

  ```typescript
  const data = {
    type: 'table',
    value: { field1: 'string', field2: 'Uint8' },
  } as const
  type Data = typeof data

  export class NewMoleculeStore extends MoleculeStore<{ data: Data }> {
    constructor(
      _schemaOption?: { data: true },
      params?: {
        states?: Record<OutPointString, GetStorageStruct<GetMoleculeStorageStruct<{ data: Data }>>>
        chainData?: Record<OutPointString, UpdateStorageValue>
        cellPattern?: CellPattern
        schemaPattern?: SchemaPattern
      },
    ) {
      super(
        { data: true },
        {
          ...params,
          options: { data },
        },
      )
    }
  }
  ```

- Use new `Store` to transform locally structured data to chain data

  - New JSONStore
    ```ts
    new JSONStore.initOnChain({
      data: {
        field1: 'a',
        field2: 'a',
        field3: 'b',
      },
    })
    ```

  ````
   - New MoleculeStore
    ```typescript
       new MoleculeStore.initOnChain({
             data: {
                 field1: 'a',
                 field2: 10
             }
       })
  ````

- Register with resource binding

  [TODO]

- Update the data
  ```typescript
  // Update from the root
  store.set(['data'], { field1: 'a1', field2: 'a1', field3: 'b1' })
  // update a field
  store.set(['data', 'field1'], 'a1')
  ```
- Get the data

  ```typescript
  // get from the root
  store.get(['data'])
  // get a filed value with key path
  store.set(['data', 'field1'])
  ```

# Tutorials & Demos

- [MVP DApp](./packages/samples/mvp-dapp)
  This is a sample Minimum Viable Product (MVP) decentralized application(dAppp) built using Kuai framework. It aims to demonstrate how easy and fast it is to build a simple dApp specific to cell model, and showcase the abstract ability to easily read and write data to cells.

- [Development Guide](./docs/tutorials/mvp-dapp.md)
  This is a comprehensive guide that lists the fundamental steps to build the [MVP DApp](./packages/samples/mvp-dapp);

# Quick start

## Environment

    node >= 18

## Kuai Installation

First, install `kuai` globally by `npm link`:

```bash
$ git clone git@github.com:ckb-js/kuai.git

$ cd kuai

$ npm install

$ npm run build

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

# Kuai Roadmap

    - M1 ~ M2
      - [x] Construct a build system similar to https://nx.dev/, only for project structure, basic tasks, and plugins
      - [x] Design storage paradigm
      - [ ] Design action paradigm
      - [ ] Design workflow with base contracts/scripts
    - M3 ~ M4
      - [ ] Implements SDK following the designed paradigm and workflow with base contracts/scripts
      - [x] Design generally used tasks and plugins
      - [ ] Cycle reporter
      - [ ] Script sizer
      - [ ] Test-coverage
      - [x] Document
      - [ ] Debugger remover
      - [ ] Typechain: https://github.com/dethcrypto/TypeChain/
      - [ ] Storage layout: https://www.npmjs.com/package/hardhat-storage-layout, when to use on-chain/off-chain data
      - [x] Design local network debug/test/deploy tools
    - M5
      - [x] Implement tasks/plugins
      - [x] Implement local network
      - [x] Implement debug/test/deploy tools
    - M6
      - [x] Use the project to deliver a simple .bit dapp
