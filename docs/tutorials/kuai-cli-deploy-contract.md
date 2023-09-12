# How to deploy contracts with kuai-cli

## deploy contract workflow by builtin signer (directly deploy):

1. `kuai contract new --name [contract-name]`
   <img width="735" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/53d53673-b50b-426d-9604-2b8481ae6222">

2. `kuai contract build --release`

<img width="755" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/7e76b8e5-ac87-4eba-b3dc-aa233ad79fca">

3. `kuai contract deploy --name [contract-name] --from [0x.....] --signer ckb-cli`
   <img width="630" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/e79ce352-ae3c-4d08-a9ac-60ceb392d874">

## deploy contract workflow by export tx:

1. `kuai contract deploy --name [contract-name] --from [0x.....] --export ./tx.json`
   <img width="634" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/0caeb12d-e6e1-4d13-8c43-519d8ccd938c">

2. `ckb-cli tx sign-inputs --tx-file ./tx.json --from-account 0xe390d4b9b4c7637ec80799bdaf644ae625cdb922 --add-signatures`
   <img width="633" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/c6be04fe-c53f-425d-848f-0dded662532e">

3. `ckb-cli tx send --tx-file ./tx.json`
   <img width="625" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/f7a73369-f900-407a-92a8-25815ffc0761">

## export tx workflow with multisig

1. ` kuai contract deploy --name sample-dapp --from multisig 0 2 0xe390d4b9b4c7637ec80799bdaf644ae625cdb922 0xb6ddba87bb5af5f053b1ae5bcbc7f4de03479f7e --export ./tx.json`
   <img width="864" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/2e9b218b-ceb8-43bc-9b80-e1a0cc459f62">

2. `ckb-cli tx sign-inputs --tx-file ./tx.json --from-account 0xe390d4b9b4c7637ec80799bdaf644ae625cdb922 --add-signatures`
   <img width="863" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/58d8b601-8a15-4ebb-9186-b0ed55fd6476">

3. `ckb-cli tx sign-inputs --tx-file ./tx.json --from-account ckt1qyqtdhd6s7a44a0s2wc6uk7tcl6duq68nalqvzxw09 --add-signatures`
   <img width="873" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/e3d3b979-e2e3-4e82-a747-f4016fcc6c5b">

4. `ckb-cli tx send --tx-file ./tx.json`
   <img width="655" alt="image" src="https://github.com/ckb-js/kuai/assets/22258327/34952c90-739f-415d-a593-a3a2ab28ebaf">

### Tips: How to deploy contract to other network

- `kuai contract deploy --name [contract-name] --from [0x.....] --network [networkname]`
- or set network to `.env` file

### Tips: add more network config

Kuai currently has three default settings for networks,` testnet` / `mainnet` / `devnet`, and users can also add custom network

- edit `kuai.config.js` of project and add network tor `networks` field

```typescript
networks: {
    [networkname: string]: {
        rpcUrl: string
        prefix: string
        scripts?: Record<string, ScriptConfig>
    }
}
```
