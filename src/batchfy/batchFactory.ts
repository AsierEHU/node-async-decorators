import { Context, Key, hash, configBuilder, proxifyObject } from "../common";
import {
  BatchConfiguration,
  BatchFunc,
  BatchInput,
  BatchStorage,
} from "./business/interfaces";
import { batchfy as baseBatchfy } from "./business/batchfy";
import { LocalBatchStorage } from "./dataAccess/localBatchStorage";

export type BatchOptions = Partial<BatchConfiguration>;
export type BatchOptionsRequired = BatchOptions;

const defaultBatchConfiguration: BatchConfiguration = {
  storage: (): BatchStorage => {
    return new LocalBatchStorage();
  },
  onError: (error: unknown) => {
    console.error(error);
  },
  context: (params: BatchInput[]): Context => {
    return params;
  },
  contextKey: (context: Context): Key => {
    return hash(context);
  },
};

export function batchfy<T extends BatchFunc>(
  asyncFunc: T,
  options?: BatchOptionsRequired
) {
  const conf = configBuilder(options, defaultBatchConfiguration);
  return baseBatchfy(asyncFunc, conf);
}

export function batchfyObject<T extends object>(
  target: T,
  methodName: keyof T,
  options?: BatchOptionsRequired
) {
  return proxifyObject(target, methodName, (asyncFunc) => {
    return batchfy(asyncFunc, options);
  });
}

export function batchWithDefaultOptions(options: BatchOptionsRequired) {
  const defaultOptions = configBuilder(options, defaultBatchConfiguration);

  function batchfy<T extends BatchFunc>(asyncFunc: T, options?: BatchOptions) {
    const conf = configBuilder(options, defaultOptions);
    return baseBatchfy(asyncFunc, conf);
  }

  function batchfyObject<T extends object>(
    target: T,
    methodName: keyof T,
    options?: BatchOptions
  ) {
    return proxifyObject(target, methodName, (asyncFunc) => {
      return batchfy(asyncFunc, options);
    });
  }

  return {
    batchfy,
    batchfyObject,
  };
}
