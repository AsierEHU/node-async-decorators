export type GenericAsyncFunction<I = any, O = any> = (
  ...params: I[]
) => Promise<O>;

export type Key = string;

export type BasicType = number | string | boolean | null;
export type BasicArrayType = Array<BasicType>;
export type BasicDictionaryType = Record<string, BasicType | BasicArrayType>;

export type GenericType = BasicType | BasicArrayType | BasicDictionaryType;
export type Context = any;
