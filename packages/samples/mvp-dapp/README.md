# Kuai MVP DApp

This is the minimal viable product to demonstrate Kuai's ability to manipulate a group of cells on CKB.

The MVP DApp is a partially implemented [data.did.id](https://data.did.id/), which works as a decentralized account profile. Compared to the fully implementation, Kuai MVP DApp only focuses on the off-chain data management, while the on-chain state verification will be supported at the next stage.

An online preview could be found at [Kuai MVP DApp](https://kuai-mvp-dapp-ui.vercel.app/)

[![kuai mvp dapp cover](https://i.imgur.com/romOKAF.png)](https://drive.google.com/file/d/15qYCk1-UMZEUSn2_-gpTv4sSO4-ZJWAa/view?usp=sharing)

## Code snippets

The magical `get` could be found at [store model of Kuai](https://github.com/ckb-js/kuai/blob/optimize-mvp-dapp/packages/models/src/store/store.ts#L91-L107)

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

The magical `set` could be found at [store model of Kuai](https://github.com/ckb-js/kuai/blob/optimize-mvp-dapp/packages/models/src/store/store.ts#L281-L300)

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

The main code of business logic could be found at [record model of mvp dapp](https://github.com/ckb-js/kuai/blob/optimize-mvp-dapp/packages/samples/mvp-dapp/src/actors/record.model.ts#L39-L62)

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
4. transform the cell transition into a transaction by view layer, [tx.view](https://github.com/ckb-js/kuai/blob/optimize-mvp-dapp/packages/samples/mvp-dapp/src/views/tx.view.ts) in this case.

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

### Build dependencies in other workspaces

Follow the [Guide](../../../README.md) to build libraries developed in other workspaces.

### Build the mvp dapp

```sh
$ npm run build
```

### Start the mvp dapp locally

### Run Redis

[Getting redis started](https://redis.io/docs/getting-started/)

### Run server

```sh
# Service is expected to run on port 3000
$ npm run start:prod
```
