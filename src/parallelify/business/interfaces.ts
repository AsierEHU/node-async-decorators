import { Context, GenericAsyncFunction, Key } from "../../common";
import { TaskQueueRunner } from "./taskQueueRunner";

export type ParallelInput = any;
export type ParallelOutput = any;
export type ParallelFunc = GenericAsyncFunction<ParallelInput, ParallelOutput>;
export interface TaskQueueRunnerStorage {
  getOrCreate(
    key: Key,
    constructorParams: ConstructorParameters<typeof TaskQueueRunner>
  ): TaskQueueRunner;
  get(key: Key): { value: TaskQueueRunner | undefined; found: boolean };
  set(key: Key, value: TaskQueueRunner): void;
  delete(key: Key): void;
}
export interface ParallelConfiguration {
  storage(): TaskQueueRunnerStorage;
  onError(error: unknown): void;
  context(params: ParallelInput[]): Context;
  contextKey(context: Context): Key;
  concurrency: number;
}
export type ParallelOptions = Partial<ParallelConfiguration>;
export type Task = () => Promise<ParallelOutput>;
