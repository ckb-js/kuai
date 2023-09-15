# Build a profile DApp with Kuai

This tutorial presents the fundamental steps to construct an MVP DApp utilizing the Kuai Framework. The codebase for the DApp is available at https://github.com/ckb-js/kuai/tree/develop/packages/samples/mvp-dapp.

This tutorial is specific to commits

<sub>1. Contract and Backend: https://github.com/ckb-js/kuai/tree/962d503e75dc808812ec216409877ddc8545c109<br /> 2. Frontend: https://github.com/Magickbase/kuai-mvp-dapp-ui/tree/97254673b545d3f2dc8edcd376f21c13d727c267</sub>
<br />

A user-oriented DApp typically requires the development of front-end, backend, and smart contracts. As Kuai is a contract and server development framework specific for Nervos CKB, this article will not cover tutorials on front-end development.

This article describes how to develop a **Profile Application** using Kuai. The application will collect users' blank Omnilock cells as storage space for their profile information, and provide basic read-write APIs. Simple validation will be performed on the profile to demonstrate contract verification.

### Before we start

A node.js CLI tool typically needs to be installed via npm before it can be utilized. Since Kuai is still in the development phase and has not been published to the npm registry, we need to clone [Kuai Repository](https://github.com/ckb-js/kuai) to our local machine and use [npm link](https://docs.npmjs.com/cli/v8/commands/npm-link) to install [kuai-cli](https://github.com/ckb-js/kuai/tree/develop/packages/cli).

Follow the steps[^1] below to install kuai-cli locally

```bash
$ git clone git@github.com:ckb-js/kuai.git

$ cd kuai

$ npm install

$ npm run build

$ cd packages/cli

$ npm link
```

### Initialize the project

```bash
# <your workspace> should be located in kuai repo because some dependencies are not published yet
# you may initialize the project at <kuai-repo>/packages/samples, "profile" in this tutorial
$ mkdir <kuai-repo>/packages/samples/profile

# cd <your workspace>
$ cd profile

$ kuai init
# samples git:(develop) kuai init
# 888    d8P                    d8b
# 888   d8P                     Y8P
# 888  d8P
# 888d88K     888  888  8888b.  888
# 8888888b    888  888     "88b 888
# 888  Y88b   888  888 .d888888 888
# 888   Y88b  Y88b 888 888  888 888
# 888    Y88b  "Y88888 "Y888888 888
#
# Welcome to kuai v0.0.1
#
# ✔ Kuai project root: · /kuai/packages/samples/profile
# ✔ Do you want to add a .gitignore? (Y/n) · true
# ✔ Do you want to build doc after create project? (Y/n) · true
#
# add kuai depende into package
#
# ......
#
# > doc
# > typedoc
#
# [info] Documentation generated at ./docs
# ✨ doc build success, you can see it at ./docs ✨
#
# ✨ Project created ✨
#
# See the README.md file for some example tasks you can run
```

The project template will be available as follows:

```
profile
├── Development.md
├── README.md
├── _cache
├── contract
│   ├── Cargo.lock
│   ├── Cargo.toml
│   ├── capsule.toml
│   ├── deployment.toml
├── docs
│   ├── assets
│   ├── classes
│   ├── index.html
│   └── modules
├── jest.config.ts
├── kuai.config.ts
├── libs
├── node_modules
├── package.json
├── src
│   ├── actors
│   ├── app.controller.ts
│   ├── main.ts
│   └── type-extends.ts
├── tsconfig.json
└── typedoc.json
```

- **src/main.ts** is the entry point of profile application. It registers services before the application starts;
- **src/app.controller.ts** is the router, which defines APIs exposed to users;
- **src/actors/** is the directory to define actor models based on specific patterns. Learn more about [actor models](https://github.com/ckb-js/topics/blob/add-draft-of-kuai-proposal/README.md) in Kuai;
- **contract/** is the workspace for contract development.

### Contract

<sub>\* The complete source code of demo can be found at https://github.com/ckb-js/kuai/tree/962d503e75dc808812ec216409877ddc8545c109/packages/samples/mvp-dapp/contract<br /> \* Go through contract development on [YouTube](https://youtu.be/zoqJiafd_CE)</sub>

#### Contract workspace

The contract workspace locates at **profile/contract**, where the development, testing, and deployment will take place.

<sub>\* The contract workspace will be polished in the future once the best practice of contract module structure is confirmed.(https://github.com/nervosnetwork/capsule/discussions/124)<br /> \* [capsule](https://github.com/nervosnetwork/capsule)[^2] is required for contract development. It will be installed on-demand automatically in the future. Now it should be installed manually by `cargo install ckb-capsule` if [rust](https://www.rust-lang.org/) is ready on your machine.</sub>

#### Add contract source code

<sub>\* This step requires [docker](https://www.docker.com/)</sub>
<br />

```bash
# kuai contract new --name <contract name>
$ kuai contract new --name kuai-mvp-contract
```

Contract template named **kuai-mvp-contract** will be generated in **profile/contract/contracts**

Fill the [kuai-mvp-contract](https://github.com/ckb-js/kuai/tree/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/contract/contracts/kuai-mvp-contract/src) we've implemented into **profile/contract/contracts/kuai-mvp-contract/src**.

<details>
<summary>Contract Libs</summary>

One unwritten norm is to abstract business logic into a lib([types](https://github.com/ckb-js/kuai/tree/c1a25782234c95ea2ddd86449f07ca38e15559dc/packages/samples/mvp-dapp/contract/types) in our case), which relates to the skills of contract development and will not be elaborated here.

</details>

#### Build and deploy contract

```bash
# cd to /profile
$ kuai contract build --release
```

Contract artifacts will be generated in **profile/contract/build/release/** for deployment.

The contract will be deployed by the default signer, [ckb-cli](https://github.com/nervosnetwork/ckb-cli)[^3], in this case, so we need to create an account for signing transactions.

<sub>\* Creating an account in ckb-cli will be supported by kuai-cli in the future</sub>
<br />

```bash
# create an account in ckb-cli
$ ckb-cli account new --wait-for-sync

# Your new account is locked with a password. Please give a password. Do not forget this password.
# Password: ********
# Repeat password: ********
# address:
#   mainnet: ckb***************************************wqw7
#   testnet: ckt***************************************slzz
# lock_arg: 0x8d**********************************fbf4
# lock_hash: 0xabd*********************************************************fbaf
```

Go to [CKB Testnet Faucet](https://faucet.nervos.org/)[^4] and claim 300,000 CKB for contract deployment.

```bash
# wait until your balance is correct
$ ckb-cli wallet get-capacity --address ckt***************************************slzz

# total: 300000.0 (CKB)
```

Deploy contracts with kuai-cli[^5]

```bash
# cd to /profile
# kuai contract deploy --name <contract name> --from <deployer address> --netwrok <chain type> --signer <signer>
$ kuai contract deploy --name kuai-mvp-contract --from ckt***************************************slzz --network testnet --signer ckb-cli

# [warn] `config` changed, regenerate lockScriptInfos!
# Input ckt1q*****************************************************************************************gt9's password for sign messge by ckb-cli:
# deploy success, txHash:  0x1ed********************************************************fbd3c
```

Deploy contracts by tx file

So far, we've completed the development&deployment of contracts.

The deployment information should be generated automatically as a facility for the backend. It will be implemented soon, now we have to set it manually at `profile/contract/deployed/contracts.json`.

<sub>\* The deployment information of the online demo can be found at https://github.com/ckb-js/kuai/tree/962d503e75dc808812ec216409877ddc8545c109/packages/samples/mvp-dapp/contract/deployed_demo</sub>

### Backend

<sub>\* The backend source code of demo can be found at [samples/mvp-dapp](https://github.com/ckb-js/kuai/tree/962d503e75dc808812ec216409877ddc8545c109/packages/samples/mvp-dapp)</sub>

#### Actor Models

An actor model is an abstract of a bundle of cells matched by specific patterns. By defining an actor model in `Kuai`, cells will be collected and decoded automatically to read and write.

There're two actor models mapped from the cells:

1. **Omnilock Model**: mapped from blank omnilock cells of a specific address as the original storage space;
2. **Record Model**: mapped from cells that hold profile data, and constrained by the contract above.

These two models are the core of the entire backend application, and they are defined in **profile/src/actors/**

##### Omnilock Model

<sub>\* The source code of omnilock model can be found at [samples/mvp-dapp/src/actors/omnilock.model.ts](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109/packages/samples/mvp-dapp/src/actors/omnilock.model.ts)</sub>

At first, the built-in model named **JSONStore** should be imported as the basic model, and decorated by patterns as follows

```typescript
@ActorProvider({ ref: { name: 'omnilock', path: '/:args/' } })
@LockFilter()
@DataFilter('0x')
@Omnilock()
export class OmnilockModel extends JSONStore<Record<string, never>> {
  constructor(
    @Param('args') args: string,
    _schemaOptions?: void,
    params?: {
      state?: Record<OutPointString, never>
      chainData?: Record<OutPointString, UpdateStorageValue>
      schemaPattern?: SchemaPattern
    },
  ) {
    super(undefined, { ...params, ref: ActorReference.newWithFilter(OmniLockModel, `/${args}`) })
    this.registerResourceBinding()
  }
}
```

Pay attention to the decorators above **OmnilockModel**

1. [ActorProvider](https://github.com/ckb-js/kuai/blob/54ada687e6f5529bc660d85f72f97c42fc441a19/packages/models/src/utils/decorator/provider.ts#L20) defines how the model instance should be indexed. It works with the constructor parameter **args** to construct a unique index;
2. [LockFilter](https://github.com/ckb-js/kuai/blob/54ada687e6f5529bc660d85f72f97c42fc441a19/packages/models/src/utils/decorator/provider.ts#L153) indicates that OmnilockModel follows a pattern of lock script;
3. [DataFilter](https://github.com/ckb-js/kuai/blob/54ada687e6f5529bc660d85f72f97c42fc441a19/packages/models/src/utils/decorator/provider.ts#L155) make sure all cells collected are plain cells;
4. [Omnilock](https://github.com/ckb-js/kuai/blob/54ada687e6f5529bc660d85f72f97c42fc441a19/packages/models/src/utils/decorator/provider.ts#L144) injects a well-known cell pattern for **LockPattern**.

By prepending all these decorators, an OmnilockModel instance represents cells owned by `OmniLockAddress(args)` as an entire object during runtime.

After then, we can add custom methods according to the business logic. Here we add [`meta`](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/actors/omnilock.model.ts#L56) to get capacity of the model and [`claim`](https://github.com/ckb-js/kuai/blob/b988eedbb224e15f5bb1d374e8d0345b8a558dc7/packages/samples/mvp-dapp/src/actors/omnilock.model.ts#L64) to transform plain omnilock cells into a profile-hold cell.

##### Record Model

<sub>\* The source code of record model can be found at [samples/mvp-dapp/src/actors/record.model.ts](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/actors/record.model.ts)</sub>

Similarly, the RecordModel can be decorated to limit its cells by `omnilock` and `type script of profile contract`

```typescript
@ActorProvider({ ref: { name: 'record', path: '/:codeHash/:hashType/:args/' } })
@LockFilter()
@TypeFilter()
@Lock() // arbitrary lock pattern
@Type(PROFILE_TYPE_SCRIPT) // Inject PROFILE_TYPE_SCRIPT for Type Pattern. PROFILE_TYPE_SCRIPT can be imported from the facility generated by contract deployment
export class RecordModel extends JSONStore<{ data: { offset: number; schema: StoreType['data'] } }> { // offset can be removed along with data prefix pattern
  constructor(
    @Param('codeHash') codeHash: string, // inject lock script code hash for Lock Pattern
    @Param('hashType') hashType: string // inject lock script hash type for Lock Pattern
    @Param('args') args: string // inject lock script args for Lock Pattern
    _schemaOptions?: { data: {offset:number} }
    params?:{
      states?: Record<OutPointString, StoreType>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    }
  ) {
    super(
      { data: { offset: (DAPP_DATA_PREFIX_LEN - 2) / 2 } },
      {
        ...params,
        ref: ActorReference.newWithFilter(RecordModel, `/${codeHash}/${hashType}/${args}/`),
      },
    )

    this.registerResourceBinding()
  }
}
```

Define [`update`](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/actors/record.model.ts#L81) to change profile, and [`clear`](https://github.com/ckb-js/kuai/blob/b988eedbb224e15f5bb1d374e8d0345b8a558dc7/packages/samples/mvp-dapp/src/actors/record.model.ts#LL110C3-L110C8) to wipe profile out

#### View

Notice that the responses of OmnilockModel and RecordModel consist of **inputs**, **outputs**, and **cellDeps**. A wrapper is required to transform them into a valid transaction. This step can be done anywhere. In this case, a [**view**](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/views/tx.view.ts) module is introduced to wrap them into a transaction.

#### Controller

Finally, requests from a client should be routed to the correct models; routes are defined in the generated [**app.controller.ts**](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/app.controller.ts) file. For instance,

```typescript
// define a claim method to generate a transaction to transform blank omnilock cells into a profile-hold cell
router.post<never, { address: string }, { capacity: HexString }>('/claim/:address', async (ctx) => {
  const { body, params } = ctx.payload

  if (!body?.capacity) {
    throw new BadRequest('undefined body field: capacity')
  }

  const omniLockModel = appRegistry.findOrBind<OmnilockModel>( // get omnilock model instance
    new ActorReference('omnilock', `/${getLock(params?.address).args}/`),
  )
  const result = omniLockModel.claim(body.capacity) // get inputs and outputs
  ctx.ok(MvpResponse.ok(await Tx.toJsonString(result))) // transform inptus and outputs into a transaction by tx view
})
```

#### Chain Source

<sub>\* The [**Chain Source**](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/src/chain-source.ts) module synchronizes data from CKB Node to Actor Models. It will be supported internally in the future and can be skipped in the code tour now.</sub>

In conclusion, the modules introduced above are the critical components of the entire backend application, as they constitute the overall logic of the entire application. Please visit [samples/mvp-dapp](https://github.com/ckb-js/kuai/blob/962d503e75dc808812ec216409877ddc8545c109g/packages/samples/mvp-dapp/) to learn all the details.

### Ref:

[^1]: Kuai Installation: https://github.com/ckb-js/kuai#kuai-installation
[^2]: Capsule and its prerequisites: https://github.com/nervosnetwork/capsule#prerequisites
[^3]: CKB CLI: https://github.com/nervosnetwork/ckb-cli
[^4]: CKB Testnet Faucet: https://faucet.nervos.org/
[^5]: Deploy contracts by kuai-cli: [kuai-cli-deploy-contract.md](./kuai-cli-deploy-contract.md)
