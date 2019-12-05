# react-use-maho

> A training-wheels tool for managing stare with statecharts.

[![NPM](https://img.shields.io/npm/v/react-use-maho.svg)](https://www.npmjs.com/package/react-use-maho) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-use-maho
```

## Usage

```tsx
import * as React from 'react'

import { useMyHook } from 'react-use-maho'

const Example = () => {
  const example = useMyHook()
  return (
    <div>
      {example}
    </div>
  )
}
```

## License

MIT © [steveruizok](https://github.com/steveruizok)

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
