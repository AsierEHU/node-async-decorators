import { buildOnce, executeInBatch, executeInParallel } from "../src/utils";
import {
  uniqueNumber,
  mockFunction,
  mockErrorFunction,
  ParallelCounter,
} from "./utils";

describe("Execute once Test", () => {
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();

  test("Execute once function returns expected right results", async () => {
    const once = buildOnce();
    const resultReal = await mockFunction(rn1, rn2);
    const result = await once(() => mockFunction(rn1, rn2), []);
    expect(result).toEqual(resultReal);
  });

  test("Execute once function returns expected exception results", async () => {
    expect.assertions(1);
    const once = buildOnce();
    try {
      await mockErrorFunction(rn1, rn2);
    } catch (e: unknown) {
      if (e instanceof Error)
        await expect(
          once(() => mockErrorFunction(rn1, rn2), [])
        ).rejects.toThrow(e);
    }
  });

  test("Original function is only called once (for the same context)", async () => {
    const once = buildOnce();
    const spyedFunction = jest.fn(mockFunction);
    await Promise.all([
      once(() => spyedFunction(3, 6), []),
      once(() => spyedFunction(4, 7), []),
      once(() => spyedFunction(5, 8), []),
    ]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Original function is called as many times as different contexts", async () => {
    const once = buildOnce();
    const spyedFunction = jest.fn(mockFunction);
    await Promise.all([
      once(() => spyedFunction(3, 6), ["hello", 5]),
      once(() => spyedFunction(4, 7), ["other"]),
      once(() => spyedFunction(5, 8), [5, "hello"]),
      once(() => spyedFunction(7, 0), []),
    ]);
    expect(spyedFunction).toBeCalledTimes(4);
  });
});

describe("Execute in parallel Test", () => {
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  test("Execute in parallel function returns expected right results", async () => {
    const tasks = [() => mockFunction(rn1, rn2), () => mockFunction(rn1, rn2)];
    const resultReal = await Promise.all(tasks.map((task) => task()));
    const result = await executeInParallel(tasks, 2);
    expect(result).toEqual(resultReal);
  });

  test("Execute in parallel function returns expected exception results", async () => {
    expect.assertions(1);
    const tasks = [
      () => mockFunction(rn1, rn2),
      () => mockErrorFunction(rn1, rn2),
    ];
    try {
      await Promise.all(tasks.map((task) => task()));
    } catch (e: unknown) {
      if (e instanceof Error)
        await expect(executeInParallel(tasks, 2)).rejects.toThrow(e);
    }
  });

  test("The max number of running tasks at the same time is 2", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const tasks = [
      () => mockFunctionWrap(rn1, rn2),
      () => mockFunctionWrap(rn1, rn2),
      () => mockFunctionWrap(rn1, rn3),
      () => mockFunctionWrap(rn2, rn2),
      () => mockFunctionWrap(rn2, rn3),
    ];
    await executeInParallel(tasks, 2);
    expect(parallelCounter.getParallelCount()).toBe(2);
    expect(parallelCounter.getParallelFlow()).toStrictEqual([
      1, 2, 1, 2, 1, 2, 1, 2, 1, 0,
    ]);
  });
});

describe("Execute in batch Test", () => {
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  test("Execute in batch function returns expected right results", async () => {
    const tasks = [() => mockFunction(rn1, rn2), () => mockFunction(rn1, rn2)];
    const resultReal = await Promise.all(tasks.map((task) => task()));
    const result = await executeInBatch(tasks, 2);
    expect(result).toEqual(resultReal);
  });

  test("Execute in batch function returns expected exception results", async () => {
    expect.assertions(1);
    const tasks = [
      () => mockFunction(rn1, rn2),
      () => mockErrorFunction(rn1, rn2),
    ];
    try {
      await Promise.all(tasks.map((task) => task()));
    } catch (e: unknown) {
      if (e instanceof Error)
        await expect(executeInBatch(tasks, 2)).rejects.toThrow(e);
    }
  });

  test("The max number of running tasks is 2 at the same time", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const tasks = [
      () => mockFunctionWrap(rn1, rn2),
      () => mockFunctionWrap(rn1, rn2),
      () => mockFunctionWrap(rn1, rn3),
      () => mockFunctionWrap(rn2, rn2),
      () => mockFunctionWrap(rn2, rn3),
    ];
    await executeInBatch(tasks, 2);
    expect(parallelCounter.getParallelCount()).toBe(2);
    expect(parallelCounter.getParallelFlow()).toStrictEqual([
      1, 2, 1, 0, 1, 2, 1, 0, 1, 0,
    ]);
  });

  test("Return an error if receives a negative concurrency parameter", async () => {
    const parallelCounter = new ParallelCounter();
    const mockFunctionWrap = parallelCounter.wrapFunction(mockFunction);
    const tasks = [
      () => mockFunctionWrap(rn1, rn2),
      () => mockFunctionWrap(rn1, rn2),
    ];
    let error: unknown = null;
    try {
      await executeInBatch(tasks, -2);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBe(null);
  });
});
