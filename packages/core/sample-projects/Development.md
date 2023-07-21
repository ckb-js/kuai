# Development

## Environment

You should start a redis service. And the redis's default port is 6379. You can edit it at `kuai.config.ts`

```typescript
import { KuaiConfig } from '@ckb-js/kuai-core';

const config: KuaiConfig = {
  REDIS_PORT: 6379,
};

export default config;
```

## Quick Start

```sh
git clone <remote_repository_location>
cd <project name>
npm install
npm run dev
```

It will start a service at `http://127.0.0.1:3000`, try to open [hello](http://127.0.0.1:3000)
