<a name="readme-top"></a>

<!-- PROJECT SHIELDS -->

<!-- [![Issues][issues-shield]][issues-url] -->

[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]
[![npm version][npm-shield]][npm-url]
[![Contributors][contributors-shield]][contributors-url]
[![PRs Welcome][Prs-shield]][Prs-url]
[![Downloads][downloads-shield]][downloads-url]

<br/>

[![ts][ts-shield]][ts-url]
[![tested with jest][jest-shield]][jest-url]
[![eslint][eslint-shield]][eslint-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/AsierEHU/node-async-decorators">
    <h3 align="center">Node-Async-Decorators</h3>
  </a>
  <p align="center">
    Async decorators for batching, caching, or concurrency control.
    <br />
    <!-- <a href="https://github.com/AsierEHU/node-async-decorators"><strong>Explore the docs »</strong></a>
    <br /> -->
    <!-- <br /> -->
    <!-- <a href="https://github.com/AsierEHU/node-async-decorators">View Demo</a>
    · -->
    <a href="https://github.com/AsierEHU/node-async-decorators/issues">Report Bug</a>
    ·
    <a href="https://github.com/AsierEHU/node-async-decorators/issues">Request Feature</a>
  </p>
</div>
<br />

<!-- TABLE OF CONTENTS -->

### Table of Contents

<ul>
  <!-- <li><a href="#about-the-project">About The Project</a></li> -->
  <li><a href="#getting-started">Getting Started</a></li>
  <li><a href="#batchfy">Batchfy</a></li>
  <li><a href="#cachefy">Cachefy</a></li>
    <ul>
      <li><a href="#redis">Redis</li>
    </ul>
  <li><a href="#parallelify">Parallelify</a></li>
  <li><a href="#utils">Utils</a>
    <ul>
      <li><a href="#execute-once">Execute once</li>
      <li><a href="#execute-in-parallel">Execute in parallel</li>
      <li><a href="#execute-in-batch">Execute in batch</li>
    </ul>
  </li>
  <li><a href="#contributing">Contributing</a></li>
  <li><a href="#license">License</a></li>
  <li><a href="#acknowledgments">Acknowledgments</a></li>
</ul>
<br/><br/>

<!-- ABOUT THE PROJECT -->
<!-- ## About The Project
<p align="right">(<a href="#readme-top">back to top</a>)</p> -->

<!-- GETTING STARTED -->

## Getting Started

```sh
npm install -S node-async-decorators
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- BATCH -->

## Batchfy

Batching is the pattern for avoiding to call the same process until the first call has been resolved.
All the next calls will be included in a pool and will be resolved all together when the first call has been finished.
Each pool will have a unique identifier generated by the context of the call.
All the calls with the same context (same pool) will be included in the same batch process.

  <br/>

### Example

```ts
import { batchfy } from "node-async-decorators";
const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};
const batchSum = batchfy(sum);

batchSum(3, 5).then((result) => {
  /*8*/
}); // call real sum
batchSum(3, 5).then((result) => {
  /*8*/
}); // wait to real sum result
batchSum(4, 7).then((result) => {
  /*11*/
}); // call real sum again because is other context
// ...
batchSum(3, 5).then((result) => {
  /*8*/
}); // call real sum again because the first call has finished
```

  <br/>

### Usage

Use batchfy directly with the default configuration.

```ts
import { batchfy, batchfyObject } from "node-async-decorators";

const myBatchedAsyncFunc = batchfy(myAsyncFunc);

batchfyObject(myInstance, "myInstanceAsyncMethod"); //modifies 'myInstance'.
```

  <br/>
  Use batchfy directly applying custom options.

```ts
import { batchfy, batchfyObject } from "node-async-decorators";

const myBatchedAsyncFunc = batchfy(myAsyncFunc, options);

batchfyObject(myInstance, "myInstanceAsyncMethod", options); //modifies 'myInstance'.
```

 <br/>
  Use batchfy modifying the the default configuration.

```ts
import { batchWithDefaultOptions } from "node-async-decorators";

const { batchfy, batchfyObject } = batchWithDefaultOptions(defaultOptions);

const myBatchedAsyncFunc = batchfy(myAsyncFunc, options);

batchfyObject(myInstance, "myInstanceAsyncMethod", options); //modifies 'myInstance'.
```

 <br/>
  By default, this is the default configuration.

```ts
import { BatchOptions } from "node-async-decorators";

const defaultOptions: BatchOptions = {
  /**
   * Promises' storage.
   */
  storage: (): BatchStorage => {
    return new LocalBatchStorage();
  },

  /**
   * In case of an error couldn't be raised, this is the handler.
   */
  onError: (error: unknown) => {
    console.error(error);
  },

  /**
   * By default, all the parameters inputed in the original async function will be taken to identify a unique resquest.
   */
  context: (params: BatchInput): Context => {
    return params;
  },

  /**
   * Predefined function to generate the unique request identifier.
   */
  contextKey: (context: Context): Key => {
    return hash(context);
  },
};
```

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CACHE -->

## Cachefy

Caching is the pattern for avoiding to call the same process until the stored result has expired.
Each call will have a unique identifier generated by the context of the call.
All the calls with the same context will receive the same result generated by the first call in that context.

  <br/>

### Example

```ts
import { cachefy } from "node-async-decorators";
const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};
const cacheSum = cachefy(sum, { ttl: 10000 });

cacheSum(3, 5).then((result) => {
  /*8*/
}); // call real sum
cacheSum(3, 5).then((result) => {
  /*8*/
}); // wait to real sum result
cacheSum(4, 7).then((result) => {
  /*11*/
}); // call real sum again because is other context
// ...
cacheSum(3, 5).then((result) => {
  /*8*/
}); // get the result from the cache storage
```

  <br/>

### Usage

Use cachefy directly with the default configuration.

```ts
import { cachefy, cachefyObject } from "node-async-decorators";

const myCachedAsyncFunc = cachefy(myAsyncFunc, { ttl: 1000 });

cachefyObject(myInstance, "myInstanceAsyncMethod", { ttl: 1000 }); //modifies 'myInstance'.
```

  <br/>
  Use cachefy directly applying custom options.

```ts
import { cachefy, cachefyObject } from "node-async-decorators";

const myCachedAsyncFunc = cachefy(myAsyncFunc, { ttl: 1000, ...options });

cachefyObject(myInstance, "myInstanceAsyncMethod", { ttl: 1000, ...options }); //modifies 'myInstance'.
```

 <br/>
  Use cachefy modifying the the default configuration.

```ts
import { cacheWithDefaultOptions } from "node-async-decorators";

const { cachefy, cachefyObject } = cacheWithDefaultOptions(
  { ttl: 1000 },
  ...defaultOptions
);

const myCachedAsyncFunc = cachefy(myAsyncFunc, { ttl: 1000 }, ...options);

cachefyObject(myInstance, "myInstanceAsyncMethod", { ttl: 1000 }, ...options); //modifies 'myInstance'.
```

 <br/>
  By default, this is the default configuration.

```ts
import { CacheOptions } from "node-async-decorators";

const defaultOptions: CacheOptions = {
  /**
   * Time in milliseconds until the result will be expired
   */
  ttl: 1000,

  /**
   * Promises' storage.
   */
  storage: (): CacheStorage => {
    return new LocalCacheStorage();
  },

  /**
   * In case of an error couldn't be raised, this is the handler.
   */
  onError: (error: unknown) => {
    console.error(error);
  },

  /**
   * By default, all the parameters inputed in the original async function will be taken to identify a unique resquest.
   */
  context: (params: CacheInput): Context => {
    return params;
  },

  /**
   * Predefined function to generate the unique request identifier.
   */
  contextKey: (context: Context): Key => {
    return hash(context);
  },
};
```

<br/>

### Redis

Redis adapter using https://www.npmjs.com/package/redis version 4.
Will use a redis DB to store the cached results.
As redis is a shared DB, by default the `RedisCacheStorage` object will create a unique space identifier to isolate the decorated function/object. You can use your custom space id to share cache stored results between multiple functions/instances.

<br/>

```ts
import { createClient } from "redis";
import {
  cacheWithDefaultOptions,
  RedisCacheStorage,
} from "node-async-decorators";

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD || "",
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

await redisClient.connect();

const { cachefy, cachefyObject } = cacheWithDefaultOptions({
  ttl: 1000,
  storage: () =>
    new RedisCacheStorage({
      redisClient,
      spaceId, // use spaceId property to define a shared space
    }),
});

const myCachedAsyncFunc = cachefy(myAsyncFunc, { ttl: 1000 }, ...options);

cachefyObject(myInstance, "myInstanceAsyncMethod", { ttl: 1000 }, ...options); //modifies 'myInstance'.

await redisClient.disconnect();
```

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PARALLEL -->

## Parallelify

Concurrency control is the pattern for avoiding to call the same process if another is still being executed.
Next calls will be included in a queue an executed in order.
The number of calls executed in parallel will be defined by a concurrency parameter.
Each call will have a unique identifier generated by the context of the call.
All the calls with the same context will be included in the same queue.

  <br/>

### Example

```ts
import { parallelify } from "node-async-decorators";
const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};
const parallelSum = parallelify(sum, { concurrency: 1 });

parallelSum(3, 5).then((result) => {
  /*8*/
}); // call real sum
parallelSum(3, 5).then((result) => {
  /*8*/
}); // call real sum when the first call has finished
parallelSum(4, 7).then((result) => {
  /*11*/
}); // call real sum again because is other context
// ...
parallelSum(3, 5).then((result) => {
  /*8*/
}); // call real sum when the rest of the calls (3, 5) have been finished
```

  <br/>

### Usage

Use parallelify directly with the default configuration.

```ts
import { parallelify, parallelifyObject } from "node-async-decorators";

const myParallelAsyncFunc = parallelify(myAsyncFunc, { concurrency: 1 });

parallelifyObject(myInstance, "myInstanceAsyncMethod", { concurrency: 1 }); //modifies 'myInstance'.
```

  <br/>
  Use parallelify directly applying custom options.

```ts
import { parallelify, parallelifyObject } from "node-async-decorators";

const myParallelAsyncFunc = parallelify(myAsyncFunc, {
  concurrency: 1,
  ...options,
});

parallelifyObject(myInstance, "myInstanceAsyncMethod", {
  concurrency: 1,
  ...options,
}); //modifies 'myInstance'.
```

 <br/>
  Use parallelify modifying the the default configuration.

```ts
import { parallelWithDefaultOptions } from "node-async-decorators";

const { parallelify, parallelifyObject } = parallelWithDefaultOptions(
  { concurrency: 1 },
  ...defaultOptions
);

const myParallelAsyncFunc = parallelify(
  myAsyncFunc,
  { concurrency: 1 },
  ...options
);

parallelifyObject(
  myInstance,
  "myInstanceAsyncMethod",
  { concurrency: 1 },
  ...options
); //modifies 'myInstance'.
```

 <br/>
  By default, this is the default configuration.

```ts
import { ParallelOptions } from "node-async-decorators";

const defaultOptions: ParallelOptions = {
  /**
   * Number of parallel executions for the same context
   */
  concurrency: 1,

  /**
   * Promises' storage.
   */
  storage: (): TaskQueueRunnerStorage => {
    return new LocalTaskQueueRunnerStorage();
  },

  /**
   * In case of an error couldn't be raised, this is the handler.
   */
  onError: (error: unknown) => {
    console.error(error);
  },

  /**
   * By default, all the parameters inputed in the original async function will be taken to identify a unique resquest.
   */
  context: (params: ParallelInput): Context => {
    return params;
  },

  /**
   * Predefined function to generate the unique request identifier.
   */
  contextKey: (context: Context): Key => {
    return hash(context);
  },
};
```

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Utils

Some utils derived from this library main functionalities.

### Execute once

Will execute the async function once under the same context.
Context is composed by an array.
Target sum function parameters do not count for the context.

```ts
import { buildOnce } from "node-async-decorators";

const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};

const once = buildOnce();

once(() => sum(2, 5), ["context-1"]).then((result) => {
  /*7*/
}); // call real sum

once(() => sum(2, 5), ["context-1"]).then((result) => {
  /*7*/
}); // return the same result for the context  ["context-1"] without calling real sum function again

once(() => sum(2, 5), ["context-2"]).then((result) => {
  /*7*/
}); // call real sum again because the context is different ["context-2"]
```

### Execute in parallel

Will execute an array of async tasks/functions.
The number of tasks executed in parallel will be defined by a concurrency parameter.
The result will be an array containing all the results in the same order of the tasks/functions. Similar to Promise.all result.

```ts
import { executeInParallel } from "node-async-decorators";

const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};

const concurrency = 2;

const tasks = [
  () => sum(1, 2), //First execution. Running tasks 1
  () => sum(2, 3), //Second execution. Running tasks 2
  () => sum(3, 4), //Third execution. Running tasks 2 (one of the last executions has finished)
  () => sum(4, 5), //Fourth execution. Running tasks 2 (one of the last executions has finished)
  () => sum(5, 6), //Fifth execution. Running tasks 2 (one of the last executions has finished)
];

const results = await executeInParallel(tasks, concurrency); // [3,5,7,9,11]
```

### Execute in batch

Will execute an array of async tasks/functions.
The array will be splitted into sub-arrays. The number of tasks in each sub-array is defined by parameters.
All the tasks inside each sub-array will be executed all together.
The next batch will start when the last has been finished.
The result will be an array containing all the results in the same order of the tasks/functions. Similar to Promise.all result.

```ts
import { executeInBatch } from "node-async-decorators";

const sum = (number1: number, number2: number) => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};

const batchSize = 2;

const tasks = [
  () => sum(1, 2), //First execution
  () => sum(2, 3), //First execution
  () => sum(3, 4), //Second execution (First batch has finished)
  () => sum(4, 5), //Second execution (First batch has finished)
  () => sum(5, 6), //Third execution (Second batch has finished)
];

const results = await executeInBatch(tasks, batchSize); // [3,5,7,9,11]
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Best README Template](https://github.com/othneildrew/Best-README-Template)
- [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- Project -->

[contributors-shield]: https://img.shields.io/github/contributors/AsierEHU/node-async-decorators.svg?style=for-the-badge
[contributors-url]: https://github.com/AsierEHU/node-async-decorators/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/AsierEHU/node-async-decorators.svg?style=for-the-badge
[stars-url]: https://github.com/AsierEHU/node-async-decorators/stargazers

<!-- [issues-shield]: https://img.shields.io/github/issues/AsierEHU/node-async-decorators.svg?style=for-the-badge
[issues-url]: https://github.com/AsierEHU/node-async-decorators/issues -->

[license-shield]: https://img.shields.io/github/license/AsierEHU/node-async-decorators.svg?style=for-the-badge
[license-url]: https://github.com/AsierEHU/node-async-decorators/blob/master/LICENSE.txt
[npm-shield]: https://img.shields.io/npm/v/node-async-decorators.svg?style=for-the-badge
[npm-url]: https://www.npmjs.com/package/node-async-decorators
[PRs-shield]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge
[PRs-url]: https://github.com/AsierEHU/node-async-decorators/README.md#contributing
[downloads-shield]: https://img.shields.io/npm/dm/node-async-decorators.svg?style=for-the-badge
[downloads-url]: https://www.npmjs.com/package/node-async-decorators

<!-- Built-in -->

[ts-shield]: https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=for-the-badge
[ts-url]: https://www.typescriptlang.org/
[jest-shield]: https://shields.io/badge/Jest-99424F?logo=Jest&style=for-the-badge
[jest-url]: https://github.com/facebook/jest
[eslint-shield]: https://shields.io/badge/Eslint-7734EB?logo=eslint&style=for-the-badge
[eslint-url]: https://eslint.org/
