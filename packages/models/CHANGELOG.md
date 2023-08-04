# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.0.1-alpha.1](https://github.com/ckb-js/kuai/compare/v0.0.1-alpha.0...v0.0.1-alpha.1) (2023-08-03)

**Note:** Version bump only for package @ckb-js/kuai-models

## [0.0.1-alpha.0](https://github.com/ckb-js/kuai/compare/v0.0.1-alpha...v0.0.1-alpha.0) (2023-07-31)

### Bug Fixes

- **deps:** update dependency tslib to v2.6.1 ([#391](https://github.com/ckb-js/kuai/issues/391)) ([a19c590](https://github.com/ckb-js/kuai/commit/a19c5900017f8dcbd6a813674ccc1704226a9361))

## 0.0.1-alpha (2023-07-21)

### Bug Fixes

- Because of I have change GetStorageOption Return Type from never to void, so it should be required. ([#240](https://github.com/ckb-js/kuai/issues/240)) ([55d17ba](https://github.com/ckb-js/kuai/commit/55d17ba592aad64f3b5f0a967495f8e56ddc50ac))
- **deps:** update dependency ioredis to v5.2.5 ([7c78cb6](https://github.com/ckb-js/kuai/commit/7c78cb6c1c2791b53b4e2e3f0568afdbd63a2087))
- **deps:** update dependency ioredis to v5.3.0 ([bddf86d](https://github.com/ckb-js/kuai/commit/bddf86d62733417e78bf72201939129cb363b885))
- **deps:** update dependency ioredis to v5.3.1 ([e4a9616](https://github.com/ckb-js/kuai/commit/e4a961661f7e87ad83edb9cd92335383142e9dce))
- **deps:** update dependency ioredis to v5.3.2 ([b784c38](https://github.com/ckb-js/kuai/commit/b784c38376f851d01540882d0cec6f1ec9638eca))
- **deps:** update dependency tslib to v2.5.0 ([f8068f4](https://github.com/ckb-js/kuai/commit/f8068f48ddf77b2f7d4f0c951cedb5ed8a7c23f1))
- **deps:** update dependency tslib to v2.5.1 ([67520d9](https://github.com/ckb-js/kuai/commit/67520d9891ca4c121dbe09a814d06ee778263c67))
- **deps:** update dependency tslib to v2.5.2 ([3a797e6](https://github.com/ckb-js/kuai/commit/3a797e64c547b3f580ebf7ff106919d3766622d4))
- **deps:** update dependency tslib to v2.5.3 ([#296](https://github.com/ckb-js/kuai/issues/296)) ([6eb6661](https://github.com/ckb-js/kuai/commit/6eb666158b97c66fd476179467c5f0f9076e2cb9))
- **deps:** update dependency tslib to v2.6.0 ([#339](https://github.com/ckb-js/kuai/issues/339)) ([d4ed219](https://github.com/ckb-js/kuai/commit/d4ed219f56825453c17e04864f9ee77a53245e00))
- **deps:** update dependency undici to v5.21.2 ([91fd2f9](https://github.com/ckb-js/kuai/commit/91fd2f975d8560165a98cf70d2c88321bf946dcd))
- **deps:** update dependency undici to v5.22.0 ([0c884b3](https://github.com/ckb-js/kuai/commit/0c884b3cfde14dea60f95d4039df82cf57efa854))
- **deps:** update dependency undici to v5.22.1 ([#261](https://github.com/ckb-js/kuai/issues/261)) ([a4c8e74](https://github.com/ckb-js/kuai/commit/a4c8e74f90a77071fca33036fbb529c68294a8c0))
- Fix request success. ([#151](https://github.com/ckb-js/kuai/issues/151)) ([5586346](https://github.com/ckb-js/kuai/commit/5586346f21b677dcc3ddc4d24948a17d6ea9cb33))
- fix sync on new blocks ([#163](https://github.com/ckb-js/kuai/issues/163)) ([89bc81f](https://github.com/ckb-js/kuai/commit/89bc81f49b617b5935bf39949257d8c88f53b654))
- mock ioredis in tests of models ([12f92fd](https://github.com/ckb-js/kuai/commit/12f92fdd2bde87d26341b29890c3ebaebe69685c))
- **resource-binding:** block for update should be added 1 every turn ([b898dd5](https://github.com/ckb-js/kuai/commit/b898dd5f19a32da8431ce8c597eaca49d16bfe2a))
- **resource-binding:** change name for the test of function "outPointToOutPointString" ([23544e6](https://github.com/ckb-js/kuai/commit/23544e6428b3ce79ca31263f3c160c83a1e07c73))
- **resource-binding:** Each combination of lock script & type ([c736211](https://github.com/ckb-js/kuai/commit/c736211516a42b5b0c7b06d1fb1bbc047598cd25))
- **resource-bingding:** use BI to format HexString when assemble the outpoint ([6512f83](https://github.com/ckb-js/kuai/commit/6512f83e65f74da59aafe7e627853c77c4fb39e5))

### Features

- add basic actor model ([#29](https://github.com/ckb-js/kuai/issues/29)) ([8db4ef2](https://github.com/ckb-js/kuai/commit/8db4ef24f692c3e121ed29eb8a78e70cad01ee95))
- Add handle cell to deserialize ([#99](https://github.com/ckb-js/kuai/issues/99)) ([40dd009](https://github.com/ckb-js/kuai/commit/40dd009ea99cb08d41beff5d4131cd46d8915666))
- Add molecule storage for store. ([#162](https://github.com/ckb-js/kuai/issues/162)) ([4558a98](https://github.com/ckb-js/kuai/commit/4558a98f7188769830e62e14ecbbce9a2d8dbdde))
- Add moleculec command. ([#357](https://github.com/ckb-js/kuai/issues/357)) ([ef628be](https://github.com/ckb-js/kuai/commit/ef628befcafd291da41547528df2d4e0a5092459))
- add mvp-dapp dockerfile ([0dd068f](https://github.com/ckb-js/kuai/commit/0dd068fdde7b7ad8deb0bc7ec810e876d2e819b2))
- add script metadata in store ([#156](https://github.com/ckb-js/kuai/issues/156)) ([93de1f2](https://github.com/ckb-js/kuai/commit/93de1f2cc2426791ae3b1f323f33f73087cb7581))
- **core:** add a kuai level global exception handling ([#204](https://github.com/ckb-js/kuai/issues/204)) ([dc43788](https://github.com/ckb-js/kuai/commit/dc437887a33c943b7336576c544210e73cb6cabf))
- implement mailbox with redis stream ([730f362](https://github.com/ckb-js/kuai/commit/730f362c48f08c4b4e90204a5f782e7e880cac8e))
- Implement store model ([#51](https://github.com/ckb-js/kuai/issues/51)) ([373e79a](https://github.com/ckb-js/kuai/commit/373e79a1f040f5ba85ff6f7ff35265a71fc39001))
- implement the registry with a container ([#50](https://github.com/ckb-js/kuai/issues/50)) ([e4435e0](https://github.com/ckb-js/kuai/commit/e4435e080a9698022009cea53a2c79e88943011e))
- io support http status & add mvp controller validator ([190fffd](https://github.com/ckb-js/kuai/commit/190fffd2e252e2bb14ce0be842cfd5d5b30f887b))
- Merged state and user can change merged state. ([#224](https://github.com/ckb-js/kuai/issues/224)) ([e8561f8](https://github.com/ckb-js/kuai/commit/e8561f8f20b4c634c23a0fbb721e11bbca7740ba))
- **model:** optimize the getting model to framework ([#181](https://github.com/ckb-js/kuai/issues/181)) ([1dca8b3](https://github.com/ckb-js/kuai/commit/1dca8b331aa7570aa33bc02a2c40a5345408f2f1))
- Omnilock Model and Record Model ([#137](https://github.com/ckb-js/kuai/issues/137)) ([3159542](https://github.com/ckb-js/kuai/commit/31595421bf9a947d43659c8f46f96fb5e2fdb5b2))
- optimize the resource binding module ([#300](https://github.com/ckb-js/kuai/issues/300)) ([fc35b12](https://github.com/ckb-js/kuai/commit/fc35b12367826965afaf9922c0615d15a555cb11))
- **resource binding:** add resource binding manager ([e2d8baa](https://github.com/ckb-js/kuai/commit/e2d8baa1269d1e0e310d8b476eb8ed2e2e7dce6b))
- **resource-binding:** add a function for converting outpoint to outpoint string ([895a3d6](https://github.com/ckb-js/kuai/commit/895a3d66db3ab52e5dd79bec293e4657c188341f))
- **resource-binding:** add current block listener for resource binding to use. ([149c073](https://github.com/ckb-js/kuai/commit/149c073e9675f7c7e6a9ebcbbefed52689a74ba0))
- **resource-binding:** add some typescript hash and lockscript hash for resource binding ([183d0ee](https://github.com/ckb-js/kuai/commit/183d0ee637799d023864b74a5c44bd400c897d8c))
- **resource-binding:** batch to send change cell information ([a0e4b74](https://github.com/ckb-js/kuai/commit/a0e4b74b98463416c0bd65625f9a5c7dcf37cf27))
- **resource-binding:** change `update_cell` to `update_cells` ([b12a177](https://github.com/ckb-js/kuai/commit/b12a1776421406791997b5b9aad87a613cc548b4))
- **resource-binding:** change module name of Listener and types for transaction listener ([2c7d1e5](https://github.com/ckb-js/kuai/commit/2c7d1e5423537a71e764c5ed1377b732a7975b77))
- **resource-binding:** change remove cell from pr [#99](https://github.com/ckb-js/kuai/issues/99) ([e25cebb](https://github.com/ckb-js/kuai/commit/e25cebb92e1aea563e7bf8fa4dc8e4c1fac38355))
- **resource-binding:** listen to top header and fetch the blocks from current block ([c313d97](https://github.com/ckb-js/kuai/commit/c313d977d8bd96b3415e25822c034d3e69009e6f))
- **resource-binding:** move the folder to models/ ([0efcb3a](https://github.com/ckb-js/kuai/commit/0efcb3a5ecf9198f005cca88d25b08225ab7aa34))
- **resource-binding:** pattern set by developer when register ([f50481d](https://github.com/ckb-js/kuai/commit/f50481da31f453d4fdb6b8e0048f996251dda660))
- **resource-binding:** use import type to instead import only ([8ccce72](https://github.com/ckb-js/kuai/commit/8ccce72cd96dca30bdbb2bf0e3183a137105b177))
- **resource-bingding:** don't use BI ([c4fc6f6](https://github.com/ckb-js/kuai/commit/c4fc6f65bc28e129bcea6af7353f7e13f832ce54))
- update mvp-dapp by the deployed contract ([#324](https://github.com/ckb-js/kuai/issues/324)) ([073becc](https://github.com/ckb-js/kuai/commit/073becc993b1a73848e9c75e498c03c993c522fd))
- update npm scope to '[@ckb-js](https://github.com/ckb-js)' ([b9a7bc9](https://github.com/ckb-js/kuai/commit/b9a7bc9661679f1f39d880c352e1697414a1ec09))
