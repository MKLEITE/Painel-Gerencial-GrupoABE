# @abe/config

Configurações compartilhadas do monorepo.

- `./eslint` — base de ESLint (flat config) usada por todos os apps.

## Uso

No `eslint.config.mjs` de um app:

```js
import base from '@abe/config/eslint';

export default [...base];
```
