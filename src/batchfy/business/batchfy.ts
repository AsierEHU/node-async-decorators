import { Key, Context, GenericAsyncFunction } from "../../common/business/util";
/**
 * Types and default configuration
 */
export type BatchInput = any;
export type BatchOutput = any;
export interface BatchStorage {
  get(key: Key): { value: Promise<BatchOutput> | undefined; found: boolean };
  set(key: Key, value: Promise<BatchOutput>): void;
  delete(key: Key): void;
}
export interface BatchConfiguration {
  storage(): BatchStorage;
  onError(error: unknown): void;
  context(params: BatchInput): Context;
  contextKey(context: Context): Key;
}
export type BatchFunc = GenericAsyncFunction<BatchInput, BatchOutput>;

/**
 * Implementation
 */
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
