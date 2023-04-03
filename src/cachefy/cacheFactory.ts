import {
  Context,
  Key,
  hash,
  configBuilder,
  proxifyObject,
} from "../common/business/util";
import {
  cachefy as baseCachefy,
  CacheInput,
  CacheFunc,
  CacheConfiguration,
  CacheStorage,
} from "./business/cachefy";
import { LocalCacheStorage } from "./dataAccess/localCacheStorage";

export type CacheOptions = Partial<CacheConfiguration>;
export type CacheOptionsRequired = CacheOptions &
  Pick<CacheConfiguration, "ttl">;

const defaultCacheConfiguration: CacheConfiguration = {
  storage: (): CacheStorage => {
    return new LocalCacheStorage();
  },
  onError: (error: unknown) => {
    console.error(error);
  },
  context: (params: CacheInput): Context => {
    return params;
  },
  contextKey: (context: Context): Key => {
    return hash(context);
  },
  ttl: 1000,
};

export const cacheWithRequiredOptions = () => {
  function cachefy<T extends CacheFunc>(
    asyncFunc: T,
    options: CacheOptionsRequired
  ) {
    const conf = configBuilder(options, defaultCacheConfiguration);
    return baseCachefy(asyncFunc, conf);
  }

  function cachefyObject<T extends object>(
    target: T,
    methodName: keyof T,
    options: CacheOptionsRequired
  ) {
    return proxifyObject(target, methodName, (asyncFunc) => {
      return cachefy(asyncFunc, options);
    });
  }

  return {
    cachefy,
    cachefyObject,
  };
};

export const cacheWithDefaultOptions = (options: CacheOptionsRequired) => {
  const defaultOptions = configBuilder(options, defaultCacheConfiguration);

  function cachefy<T extends CacheFunc>(asyncFunc: T, options?: CacheOptions) {
    const conf = configBuilder(options, defaultOptions);
    return baseCachefy(asyncFunc, conf);
  }

  function cachefyObject<T extends object>(
    target: T,
    methodName: keyof T,
    options?: CacheOptions
  ) {
    return proxifyObject(target, methodName, (asyncFunc) => {
      return cachefy(asyncFunc, options);
    });
  }

  return {
    cachefy,
    cachefyObject,
  };
};
