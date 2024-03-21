import { BatchConfiguration, BatchFunc } from "./interfaces";

export function batchfy<T extends BatchFunc>(
  asyncFunc: T,
  conf: BatchConfiguration
): T {
  const storage = conf.storage();

  const batchfyedFunction = function (...params) {
    const context = conf.context(params);
    const key = conf.contextKey(context);

    const { value, found } = storage.get(key);
    if (found) return value;

    const promise = asyncFunc(...params);
    storage.set(key, promise);
    promise
      .finally(() => {
        try {
          storage.delete(key);
        } catch (error) {
          conf.onError(error);
        }
      })
      .catch(() => {
        return;
      });
    return promise;
  } as T;

  return batchfyedFunction;
}
