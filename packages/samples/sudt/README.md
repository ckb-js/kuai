# Sample Kuai Project

This project demonstrates a basic kuai use case.

## Run server

```
npm run build

node ./dist/src/main.js
```

## API Doc

### Mint Token

path: /sudt/mint/:typeId

method: POST

#### Request

```javascript
{
  "from": [""],
  "to": "",
  "amount": "1000",
}
```

#### Response

```javascript
{
  "code": 200,
  "data": {
    "txSkeleton": "txSkeleton": {
        "cellProvider": null,
        "cellDeps": [
            {
                "outPoint": {
                    "txHash": "0x27b62d8be8ed80b9f56ee0fe41355becdb6f6a40aeba82d3900434f43b1c8b60",
                    "index": "0x0"
                },
                "depType": "code"
            },
            {
                "outPoint": {
                    "txHash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
                    "index": "0x0"
                },
                "depType": "depGroup"
            },
            {
                "outPoint": {
                    "txHash": "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
                    "index": "0x0"
                },
                "depType": "code"
            }
        ],
        "headerDeps": [],
        "inputs": [
            {
                "cellOutput": {
                    "capacity": "0x1b41bf852c00",
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "type": null
                },
                "data": "0x",
                "outPoint": {
                    "txHash": "0x5f2d84f67f378972ba7ee285e4d013450862d31defc121769fbf61fd5810627d",
                    "index": "0x1"
                },
                "blockNumber": "0xa66258"
            }
        ],
        "outputs": [
            {
                "cellOutput": {
                    "capacity": "0x35a4e9000",
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "type": {
                        "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
                        "hashType": "type",
                        "args": "0xfb7b6c4a2baf39ebfdd634e76737725362cf18042a31256488382137ae830784"
                    }
                },
                "data": "0xa0860100000000000000000000000000"
            },
            {
                "cellOutput": {
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "capacity": "0x1b3e65351560"
                },
                "data": "0x"
            }
        ],
        "witnesses": [
            "0x690000001000000069000000690000005500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        ],
        "fixedEntries": [],
        "signingEntries": [],
        "inputSinces": {}
    }
  }
}
```

### Create Token

path: /token

method: POST

#### Request

```javascript
{
  "code": 200,
  "data": {
    "name": "USDT",
    "account": "", // the address of owner
    "decimal": 18,
    "description": "",
    "website": "",
    "icon": "",
    "email": ""
  }
}
```

#### Reponse

```javascript
{
    "code": "201",
    "data": {
      "txSkeleton": {
        "cellProvider": null,
        "cellDeps": [
            {
                "outPoint": {
                    "txHash": "0x27b62d8be8ed80b9f56ee0fe41355becdb6f6a40aeba82d3900434f43b1c8b60",
                    "index": "0x0"
                },
                "depType": "code"
            },
            {
                "outPoint": {
                    "txHash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
                    "index": "0x0"
                },
                "depType": "depGroup"
            },
            {
                "outPoint": {
                    "txHash": "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
                    "index": "0x0"
                },
                "depType": "code"
            }
        ],
        "headerDeps": [],
        "inputs": [
            {
                "cellOutput": {
                    "capacity": "0x1b41bf852c00",
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "type": null
                },
                "data": "0x",
                "outPoint": {
                    "txHash": "0x5f2d84f67f378972ba7ee285e4d013450862d31defc121769fbf61fd5810627d",
                    "index": "0x1"
                },
                "blockNumber": "0xa66258"
            }
        ],
        "outputs": [
            {
                "cellOutput": {
                    "capacity": "0x35a4e9000",
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "type": {
                        "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
                        "hashType": "type",
                        "args": "0xfb7b6c4a2baf39ebfdd634e76737725362cf18042a31256488382137ae830784"
                    }
                },
                "data": "0xa0860100000000000000000000000000"
            },
            {
                "cellOutput": {
                    "lock": {
                        "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                        "hashType": "type",
                        "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                    },
                    "capacity": "0x1b3e65351560"
                },
                "data": "0x"
            }
        ],
        "witnesses": [
            "0x690000001000000069000000690000005500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        ],
        "fixedEntries": [],
        "signingEntries": [],
        "inputSinces": {}
    }
  }
}
```

### Update Token

path: /token/:typeId

method: PUT

#### Request

```javascript
{
  "code": 200,
  "data": {
    "name": "USDT",
    "decimal": 18,
    "description": "",
    "website": "",
    "icon": "",
    "explorerCode": "" // the verify code from explorer
  }
}
```

#### Response

```javascript
{
  "code": 201,
  "data": {}
}
```

### Transfer Token

path: /token/transfer

method: POST

#### Request

```javascript
{
  "typeId": "", // token args
  "amount": "",
  "to": ""
}
```

#### Response

```javascript
{
  "code": 200,
  "data": {
    "txSkeleton": {
      "cellProvider": null,
      "cellDeps": [
          {
              "outPoint": {
                  "txHash": "0x27b62d8be8ed80b9f56ee0fe41355becdb6f6a40aeba82d3900434f43b1c8b60",
                  "index": "0x0"
              },
              "depType": "code"
          },
          {
              "outPoint": {
                  "txHash": "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
                  "index": "0x0"
              },
              "depType": "depGroup"
          },
          {
              "outPoint": {
                  "txHash": "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
                  "index": "0x0"
              },
              "depType": "code"
          }
      ],
      "headerDeps": [],
      "inputs": [
          {
              "cellOutput": {
                  "capacity": "0x1b41bf852c00",
                  "lock": {
                      "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                      "hashType": "type",
                      "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                  },
                  "type": null
              },
              "data": "0x",
              "outPoint": {
                  "txHash": "0x5f2d84f67f378972ba7ee285e4d013450862d31defc121769fbf61fd5810627d",
                  "index": "0x1"
              },
              "blockNumber": "0xa66258"
          }
      ],
      "outputs": [
          {
              "cellOutput": {
                  "capacity": "0x35a4e9000",
                  "lock": {
                      "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                      "hashType": "type",
                      "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                  },
                  "type": {
                      "codeHash": "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
                      "hashType": "type",
                      "args": "0xfb7b6c4a2baf39ebfdd634e76737725362cf18042a31256488382137ae830784"
                  }
              },
              "data": "0xa0860100000000000000000000000000"
          },
          {
              "cellOutput": {
                  "lock": {
                      "codeHash": "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
                      "hashType": "type",
                      "args": "0x00afbf535944be46a2f5879a3a349bc4fd5784a0e900"
                  },
                  "capacity": "0x1b3e65351560"
              },
              "data": "0x"
          }
      ],
      "witnesses": [
          "0x690000001000000069000000690000005500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      ],
      "fixedEntries": [],
      "signingEntries": [],
      "inputSinces": {}
    }
  }
}
```

### Token List

path: /token

#### Request

| param   | type   | position | description  |
| ------- | ------ | -------- | ------------ |
| address | string | query    | user address |

method: GET

#### Response

```javascript
{
  "code": 200,
  "data": [
    {
      "uan": "USDT",
      "displayName": "USDT",
      "name": "USDT",
      "decimal": 18,
      "description": "",
      "website": "",
      "icon": "",
      "url": "",
      "issuser": "",
      "args": "",
      "typeId": "",
    },
  ]
}
```

### Token Detail

path: /token/:args

method: GET

#### Response

```javascript
{
  "code": 200,
  "data": {
    "uan": "USDT",
    "displayName": "USDT",
    "name": "USDT",
    "decimal": 18,
    "description": "",
    "website": "",
    "icon": "",
    "url": "",
    "issuser": ""
  }
}
```

### Asset List

path: /account/:address/assets

method: GET

#### Request

| param   | type   | position | description  |
| ------- | ------ | -------- | ------------ |
| address | string | query    | user address |

#### Response

```javascript
{
  "code": 200,
  "data": [
      {
        "uan": "USDT",
        "displayName": "USDT",
        "decimal": 18,
        "amount": ""
      }
    ]
}
```

### Token Transfer History

path: /account/:address/assets/transfer/history

method: GET

#### Response

```javascript
{
  "code": 200,
  "data": [
    {
      "txHash": "",
      "from": "",
      "to": "",
      "time": "",
      "status": "",
      "sudtAmount": "",
      "CKBAmount": "",
      "url": "",
    }
  ]
}
```
