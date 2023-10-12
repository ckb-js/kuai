# Sample Kuai Project

This project demonstrates a basic kuai use case.

## Run server

```
npm run build

node ./dist/src/main.js
```

## API Doc

### Create Token

path: /token

method: POST

#### Request

```javascript
{
  "code": 200,
  "data": {
    "symbol": "USDT",
    "name": "USDT",
    "account": "", // the args of account in omnilock
    "supply": "100000",
    "decimal": 18,
    "description": "",
    "website": "",
    "icon": "",
    "typeId": "",
    "args": "", // the args of sudt type script
    "explorerCode": "" // the verify code from explorer
  }
}
```

#### Reponse

```javascript
{
  "code": 201,
  "data": {
    "url": "" // direct to explorer to the transaction to issue the token
  }
}
```

### Update Token

path: /token

method: PUT

#### Request

```javascript
{
  "code": 200,
  "data": {
    "symbol": "USDT",
    "name": "USDT",
    "amount": "100000",
    "decimal": "18",
    "description": "",
    "website": "",
    "icon": "",
    "args": "", // sudt args
    "signature": ""
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
  "code": 200,
  "data": {
    "token": "", // token args
    "amount": "",
    "to": ""
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
      symbol: 'USDT',
      name: 'USDT',
      amount: '100000',
      decimal: '18',
      description: '',
      website: '',
      icon: '',
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
    "symbol": "USDT",
    "name": "USDT",
    "amount": "100000",
    "decimal": "18",
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
        "symbol": "USDT",
        "name": "USDT",
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
