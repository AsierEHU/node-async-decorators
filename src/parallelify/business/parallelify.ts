import { ParallelFunc, ParallelConfiguration, Task } from "./interfaces";

export function parallelify<T extends ParallelFunc>(
  asyncFunc: T,
  conf: ParallelConfiguration
): T {
  const storage = conf.storage();

  return function (...params) {
    const context = conf.context(params);
    const key = conf.contextKey(context);

    const taskRunner = storage.getOrCreate(key, [
      {
        concurrency: conf.concurrency,
        onFinished: () => {
          try {
            storage.delete(key);
          } catch (error) {
            conf.onError(error);
          }
        },
      },
    ]);

    return new Promise((resolve, reject) => {
      const task: Task = () => {
        const promise = asyncFunc(...params);
        promise.then(resolve, reject);
        return promise;
      };
      taskRunner.push(task);
    });
  } as T;
}
