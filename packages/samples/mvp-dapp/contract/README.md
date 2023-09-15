# kuai mvp contract

## Install dependencies

- [ckb-cli](https://github.com/nervosnetwork/ckb-cli)
- [capsule](https://github.com/nervosnetwork/capsule)

## Configuration file modification

By default, we have integrated several [networks](https://github.com/ckb-js/kuai/blob/develop/packages/core/src/constants.ts#L8) that can be used in the configuration file as follows.

```js
module.exports = {
  ...
  network: 'testnet' | 'mainnet',
  jest: {
      ...
  },
}

```

If we need to customize the network, we can modify the `kuai.config.js` file in the root of the project.

```js
module.exports = {
  ...
  network: 'testnet',
  networks: {
    testnet: {
      rpcUrl: 'https://testnet.ckb.dev',
      prefix: 'ckt',
    }
  },
  jest: {
      ...
  },
}

```

## Contract new

```shell
$ kuai contract new --name kuai-mvp-contract
```

The contract project will be initialized in the `contracts/` directory, located in the root directory of the project.

We can develop contracts in Contract Engineering.

## Contract build

```shell
$ capsule build --release
```

## Contract deploy

```shell
$ kuai contract deploy --name kuai-mvp-contract --from ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq25dhcqh3x2zd8008c8re2khlsy9nxdjss6xne37 --network testnet --signer ckb-cli
```
