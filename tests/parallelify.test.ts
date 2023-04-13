import { parallelWithDefaultOptions } from "../src/parallelify";
import { LocalTaskQueueRunnerStorage } from "../src/parallelify/dataAccess/localTaskQueueRunnerStorage";
import {
  uniqueNumber,
  mockFunction,
  mockErrorFunction,
  mockNoParamsUniqueFunction,
  mockObject,
  ParallelCounter,
} from "./utils";

describe("Parallel Test (Default config)", () => {
  const { parallelify, parallelifyObject } = parallelWithDefaultOptions({
    concurrency: 1,
  });
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  test("Parallelifyed function returns expected right results", async () => {
    const resultReal = await mockFunction(rn1, rn2);
    const func = parallelify(mockFunction);
    const resultBatched = await func(rn1, rn2);
    expect(resultBatched).toEqual(resultReal);
  });

  test("Parallelifyed function returns expected exception results", async () => {
    const func = parallelify(mockErrorFunction);
    let errorReal: unknown = null;
    try {
      await mockErrorFunction(rn1, rn2);
    } catch (e) {
      errorReal = e;
    }
    let errorBatched: unknown = null;
    try {
      await func(rn1, rn2);
    } catch (e) {
      errorBatched = e;
    }
    expect(errorBatched).toEqual(errorReal);
  });

  test("Original function has been called as many times as the elements in the queue when the queue is finished", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = parallelify(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(3);
  });

  test("Parallelified function returns the same result after the queue process finished in every call (for the same context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = parallelify(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn2);
    const promise3 = func(rn1, rn2);
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
  });

  test("Parallelified function returns different result after the queue process finished in every call (for different context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = parallelify(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn3);
    expect((await promise1) === (await promise2)).toBe(false);
  });

  test("Without params' functions use the same context by default", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(
      mockNoParamsUniqueFunction
    );
    const func = parallelify(mockFunctionWrap);
    await Promise.all([func(), func(), func(), func()]);
    expect(parallelCounter.getParallelCount()).toBe(1);
  });

  test("Original function is being called one by one (concurrency 1, same context)", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const func = parallelify(mockFunctionWrap, { contextKey: () => "test" });
    await Promise.all([func(0, 0), func(1, 1), func(2, 2), func(3, 3)]);
    expect(parallelCounter.getParallelCount()).toBe(1);
  });

  test("Original function is being called two by two (concurrency 2, same context)", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const func = parallelify(mockFunctionWrap, {
      contextKey: () => "test",
      concurrency: 2,
    });
    await Promise.all([func(0, 0), func(1, 1), func(2, 2), func(3, 3)]);
    expect(parallelCounter.getParallelCount()).toBe(2);
    expect(parallelCounter.getParallelFlow()).toStrictEqual([
      1, 2, 1, 2, 1, 2, 1, 0,
    ]);
  });

  test("Original function is being called one by one for each context (concurrency 1, 2 contexts)", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const func = parallelify(mockFunctionWrap, {
      context: (params) => params[0],
    });
    await Promise.all([
      func(0, 1),
      func(0, 2),
      func(0, 3),
      func(1, 0),
      func(1, 1),
    ]);
    expect(parallelCounter.getParallelCount()).toBe(2);
    expect(parallelCounter.getParallelFlow()).toStrictEqual([
      1, 2, 1, 2, 1, 2, 1, 2, 1, 0,
    ]);
  });

  test("All the functions work in parallel in the same context if concurrency >= the number of functions", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const func = parallelify(mockFunctionWrap, {
      contextKey: () => "test",
      concurrency: 3,
    });
    await Promise.all([func(0, 0), func(1, 1), func(2, 2)]);
    expect(parallelCounter.getParallelCount()).toBe(3);
    expect(parallelCounter.getParallelFlow()).toStrictEqual([1, 2, 3, 2, 1, 0]);
  });

  test("Storage remove all it's taskRunners when the queue has been finalished", async () => {
    const parallelStorage = new LocalTaskQueueRunnerStorage();
    const spyedFunc = jest.spyOn(parallelStorage, "delete");
    const func = parallelify(mockFunction, {
      storage: () => {
        return parallelStorage;
      },
    });
    func(rn1, rn2);
    func(rn1, rn3);
    await Promise.all([
      func(rn1, rn2),
      func(rn1, rn2),
      func(rn1, rn3),
      func(rn1, rn3),
      func(rn1, rn3),
      func(rn2, rn3),
    ]);
    expect(spyedFunc).toBeCalledTimes(3);
  });

  test("Proxy object with parallelify works -> Original function is being called one by one (concurrency 1, same context)", async () => {
    const parallelCounter = new ParallelCounter();
    parallelCounter.wrapObject(mockObject, "mockFunction");
    parallelifyObject(mockObject, "mockFunction", { contextKey: () => "test" });
    await Promise.all([
      mockObject.mockFunction(rn1),
      mockObject.mockFunction(rn2),
      mockObject.mockFunction(rn1),
    ]);
    expect(parallelCounter.getParallelCount()).toBe(1);
  });
});
