import { batchfy } from "../../batchfy";
import { CacheConfiguration, CacheFunc } from "./interfaces";

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
