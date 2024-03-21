import { Context, Key, hash, configBuilder, proxifyObject } from "../common";
import { parallelify as baseParallelify } from "./business/parallelify";
import {
  ParallelConfiguration,
  ParallelFunc,
  ParallelInput,
  TaskQueueRunnerStorage,
} from "./business/interfaces";
import { LocalTaskQueueRunnerStorage } from "./dataAccess/localTaskQueueRunnerStorage";

export type ParallelOptions = Partial<ParallelConfiguration>;
export type ParallelOptionsRequired = ParallelOptions &
  Pick<ParallelConfiguration, "concurrency">;

const defaultParallelConfiguration: ParallelConfiguration = {
  concurrency: 1,
  storage: (): TaskQueueRunnerStorage => {
    return new LocalTaskQueueRunnerStorage();
  },
  onError: (error: unknown) => {
    console.error(error);
  },
  context: (params: ParallelInput[]): Context => {
    return params;
  },
  contextKey: (context: Context): Key => {
    return hash(context);
  },
};

export function parallelify<T extends ParallelFunc>(
  asyncFunc: T,
  options: ParallelOptionsRequired
) {
  const conf = configBuilder(options, defaultParallelConfiguration);
  return baseParallelify(asyncFunc, conf);
}

export function parallelifyObject<T extends object>(
  target: T,
  methodName: keyof T,
  options: ParallelOptionsRequired
) {
  return proxifyObject(target, methodName, (asyncFunc) => {
    return parallelify(asyncFunc, options);
  });
}

export function parallelWithDefaultOptions(options: ParallelOptionsRequired) {
  const defaultOptions = configBuilder(options, defaultParallelConfiguration);

  function parallelify<T extends ParallelFunc>(
    asyncFunc: T,
    options?: ParallelOptions
  ) {
    const conf = configBuilder(options, defaultOptions);
    return baseParallelify(asyncFunc, conf);
  }

  function parallelifyObject<T extends object>(
    target: T,
    methodName: keyof T,
    options?: ParallelOptions
  ) {
    return proxifyObject(target, methodName, (asyncFunc) => {
      return parallelify(asyncFunc, options);
    });
  }

  return {
    parallelify,
    parallelifyObject,
  };
}
