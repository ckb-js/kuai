# kuai mvp contract

## Install dependencies

- [ckb-cli](https://github.com/nervosnetwork/ckb-cli)
- [capsule](https://github.com/nervosnetwork/capsule)

## Contract build

```shell
$ capsule build --release
```

## Contract deploy

### Configuration file modification

Modify kuai.config.js in the project root directory to change the following configuration:

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

```shell
$ kuai contract deploy --name kuai-mvp-contract --from ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq25dhcqh3x2zd8008c8re2khlsy9nxdjss6xne37 --network testnet
```
