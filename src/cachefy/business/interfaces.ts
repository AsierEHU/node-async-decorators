import { Context, GenericAsyncFunction, Key, GenericType } from "../../common";

export type CacheInput = any;
export type CacheOutput = GenericType;
export interface CacheStorage {
  get(key: Key): Promise<{ value: CacheOutput | undefined; found: boolean }>;
  set(key: Key, value: CacheOutput, ttl: number): Promise<void>;
  delete(key: Key): Promise<void>;
}
export interface CacheConfiguration {
  storage(): CacheStorage;
  onError(error: unknown): void;
  context(params: CacheInput[]): Context;
  contextKey(context: Context): Key;
  ttl: number;
}
export type CacheFunc = GenericAsyncFunction<CacheInput, CacheOutput>;
