# Kuai MVP DApp

This is the minimum viable product(MVP) designed to demonstrate Kuai's ability to manipulate a group of cells on the Nervos Common Knowledge Base (CKB).

The Kuai MVP DApp is a partially implemented [data.did.id](https://data.did.id/), which serves as a decentralized account profile. In comparison to the fully implemented version, the Kuai MVP DApp focuses solely on on- and off-chain data management. On-chain state verification will be supported in the next stage of development.

You can find an online preview of the Kuai MVP DApp at https://kuai-mvp-dapp-ui.vercel.app/.

[![kuai mvp dapp cover](https://i.imgur.com/romOKAF.png)](https://youtu.be/-R3EQxcWJVU)

## Development Guide

A comprehensive guide is available at [docs/tutorials/mvp-dapp.md](../../../docs/tutorials/mvp-dapp.md)

## Code snippets

The magical `get` could be found at [store model of Kuai](https://github.com/ckb-js/kuai/blob/develop/packages/models/src/store/store.ts#L91-L107)

```typescript
  public load(path?: string) {
    let local = {}
    const customizer = (objValue: StructSchema, srcValue: StructSchema) => {
      if (Array.isArray(objValue)) {
        return objValue.concat(srcValue)
      }
    }
    Object.values(this.states).forEach((state) => {
      local = mergeWith(local, state, customizer)
    })

    if (path) {
      return get(local, path, null)
    }

    return local
  }
```

The magical `set` could be found at [store model of Kuai](https://github.com/ckb-js/kuai/blob/develop/packages/models/src/store/store.ts#L281-L300)

```typescript
  initOnChain(value: GetStorageStruct<StructSchema>): GetOnChainStorage<StructSchema> {
    const res: StorageSchema<string> = {}
    if ('data' in value) {
      const { offset, hexString } = this.serializeField('data', value.data)
      res.data = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('witness' in value) {
      const { offset, hexString } = this.serializeField('witness', value.witness)
      res.witness = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('lockArgs' in value) {
      const { offset, hexString } = this.serializeField('lockArgs', value.lockArgs)
      res.lockArgs = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('typeArgs' in value) {
      const { offset, hexString } = this.serializeField('typeArgs', value.typeArgs)
      res.typeArgs = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    return res as GetOnChainStorage<StructSchema>
  }
```

With the power of magical `get` and `set`, the business model `record`, representing a storage with a custom schema, has the ability to manipulate cells by users' mind

The main code of business logic could be found at [record model of mvp dapp](https://github.com/ckb-js/kuai/blob/develop/packages/samples/mvp-dapp/src/actors/record.model.ts#L39-L62)

```typescript
  update(newValue: StoreType['data']) {
    const inputs = Object.values(this.chainData)
    if (!inputs.length) throw new InternalServerError('No mvp cell to set value')
    const { data } = this.initOnChain({ data: newValue })
    const outputCapacity = inputs
      .reduce((pre: BI, cur) => pre.add(cur.cell.cellOutput.capacity), BI.from(0))
      .sub(TX_FEE)
    if (outputCapacity.lt('6100000000')) throw new Error('not enough capacity')
    const outputs: Cell[] = [
      {
        cellOutput: {
          ...inputs[0]!.cell.cellOutput,
          capacity: outputCapacity.toHexString(),
        },
        data: `${inputs[0]!.cell.data.slice(0, 2 + this.schemaOption!.data.offset * 2)}${data.slice(
          2 + this.schemaOption!.data.offset * 2,
        )}`,
      },
    ]
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: outputs,
    }
  }
```

<sub>TODO: the `update` method, which returns `inputs/outputs`, should be delivered in `store model` natively because `inputs/outputs` is the only meaningful result of a modification.</sub>

With the help of `get` and `update`, the following workflow is feasible

1. dump the entire state into local by `load()`;
2. manipulate on the local state;
3. generate cell transition from `prev state` to `new state` by `update()`.
4. transform the cell transition into a transaction by view layer, [tx.view](https://github.com/ckb-js/kuai/blob/develop/packages/samples/mvp-dapp/src/views/tx.view.ts) in this case.

It's quite similar to the [setState](https://reactjs.org/docs/faq-state.html#what-does-setstate-do) method in [React](https://reactjs.org/). No matter how many updates are scheduled by `setState`, only the final state will be rendered in a frame.

## What's Next

1. manipulate states on several cells
   1. load and merge a global state from cells;
   2. locate the correct cell on updating state
2. implement the `contract model` based on `store model`: https://github.com/ckb-js/kuai/issues/3
3. declare models by decorator with parameters: as https://github.com/ckb-js/kuai/blob/develop/packages/models/src/examples/dapp/actors/child.ts#L4
4. instantiate models on demand: https://github.com/ckb-js/kuai/issues/160
5. support declarative routes: https://github.com/ckb-js/kuai/issues/159

---

## Getting started

### Get Contract Ready

#### Deploy your own contract

Follow https://github.com/ckb-js/kuai/issues/306 to deploy your own contract. Or

#### Connect to the demo contract deployed on the Testnet

The deployment information located at `mvp-dapp/contract/deployed_demo`, rename it to `mvp-dapp/contract/deployed` to connect to

### Start server

#### Clone this project locally

```sh
$ git clone https://github.com/ckb-js/kuai.git
```

#### Install dependencies and build kuai modules locally

```sh
$ cd kuai
$ npm i
$ npm run build
```

#### Run the mvp dapp

- run the mvp dapp in develop mode

```sh
$ cd ./packages/samples/mvp-dapp
$ npm run dev
```

- run the mvp dapp in production mode

```sh
$ cd ./packages/samples/mvp-dapp
$ npm run build
# Service is expected to run on port 3000
$ npm run start:prod
```

### Get CKB Node Ready

#### How to run CKB node locally

- Mainnet: https://docs.nervos.org/docs/basics/guides/mainnet
- Testnet: https://docs.nervos.org/docs/basics/guides/testnet
- Devnet: https://docs.nervos.org/docs/basics/guides/devchain

#### Available CKB nodes of community

- Mainnet RPC endpoint: https://mainnet.ckb.dev/rpc
- Testnet RPC endpoint: https://testnet.ckb.dev/rpc

### Start the mvp dapp locally

### Run Redis

[Getting redis started](https://redis.io/docs/getting-started/)
