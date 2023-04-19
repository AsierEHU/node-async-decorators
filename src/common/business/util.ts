import hasher from "node-object-hash";
const hashSortCoerce = hasher({ coerce: false, sort: false });

export function hash(context: Context): Key {
  const key = hashSortCoerce.hash(context);
  return key;
}

export type GenericAsyncFunction<I = any, O = any> = (
  ...params: I[]
) => Promise<O>;

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

export type Key = string;

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

export type BasicType = number | string | boolean | null;
export type BasicArrayType = Array<BasicType>;
export type BasicDictionaryType = Record<string, BasicType | BasicArrayType>;

export type GenericType = BasicType | BasicArrayType | BasicDictionaryType;
export type Context = any;
