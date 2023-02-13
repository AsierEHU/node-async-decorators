import { cacheWithRequiredOptions, cacheWithDefaultOptions, CacheOptions, CacheOptionsRequired } from "./cacheFactory";

export const { cachefy, cachefyObject } = cacheWithRequiredOptions()
export { cacheWithDefaultOptions, CacheOptions, CacheOptionsRequired }

export { CacheStorage } from "./business/cachefy"