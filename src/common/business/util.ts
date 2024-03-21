import hasher from "node-object-hash";
import { Context, Key, GenericAsyncFunction } from "./interfaces";

const hashSortCoerce = hasher({ coerce: false, sort: false });

export function hash(context: Context): Key {
  const key = hashSortCoerce.hash(context);
  return key;
}

export function configBuilder<T>(
  options: Partial<T> | undefined,
  defaultConfiguration: T
): T {
  if (!options) return defaultConfiguration;
  return {
    ...defaultConfiguration,
    ...options,
  };
}

export function proxifyObject<T extends object>(
  target: T,
  methodName: keyof T,
  proxy: <F extends GenericAsyncFunction>(targetMethod: F) => F
): void {
  const asyncFunc = target[methodName];
  if (typeof asyncFunc !== "function")
    throw new Error(`Function ${String(methodName)} not found in object`);
  const proxyfiedFunction = proxy(asyncFunc.bind(target));
  target[methodName] = proxyfiedFunction as T[keyof T];
}
