import { batchfy } from "../../batchfy";
import {
  ArrayType,
  BasicType,
  Context,
  DictionaryType,
  GenericAsyncFunction,
  Key,
} from "../../common/business/util";

/**
 * Types and default configuration
 */
export type CacheInput = any;
export type CacheOutput = BasicType | ArrayType | DictionaryType;
export interface CacheStorage {
  get(key: Key): Promise<{ value: CacheOutput | undefined; found: boolean }>;
  set(key: Key, value: CacheOutput, ttl: number): Promise<void>;
  delete(key: Key): Promise<void>;
}
export interface CacheConfiguration {
  storage(): CacheStorage;
  onError(error: unknown): void;
  context(params: CacheInput): Context;
  contextKey(context: Context): Key;
  ttl: number;
}
export type CacheFunc = GenericAsyncFunction<CacheInput, CacheOutput>;

/**
 * Implementation
 */
export function cachefy<T extends CacheFunc>(
  asyncFunc: T,
  conf: CacheConfiguration
): T {
  const cacheStorage = conf.storage();

  const cachefyedFunction = async function (...params) {
    const context = conf.context(params);
    const key = conf.contextKey(context);

    const { value, found } = await cacheStorage.get(key);
    if (found) return value;

    const promise = asyncFunc(...params);
    promise
      .then(async (value) => {
        try {
          await cacheStorage.set(key, value, conf.ttl);
        } catch (error) {
          conf.onError(error);
        }
      })
      .catch(() => {
        return;
      });
    return promise;
  } as T;

  const batchfyedCachefyedFunction = batchfy(cachefyedFunction, {
    context: conf.context,
    contextKey: conf.contextKey,
    onError: conf.onError,
  });

  return batchfyedCachefyedFunction;
}
