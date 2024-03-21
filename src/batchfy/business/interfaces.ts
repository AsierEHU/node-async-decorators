import { Key, Context, GenericAsyncFunction } from "../../common/";

export type BatchInput = any;
export type BatchOutput = any;
export interface BatchStorage {
  get(key: Key): { value: Promise<BatchOutput | undefined>; found: boolean };
  set(key: Key, value: Promise<BatchOutput>): void;
  delete(key: Key): void;
}
export interface BatchConfiguration {
  storage(): BatchStorage;
  onError(error: unknown): void;
  context(params: BatchInput[]): Context;
  contextKey(context: Context): Key;
}
export type BatchFunc = GenericAsyncFunction<BatchInput, BatchOutput>;
