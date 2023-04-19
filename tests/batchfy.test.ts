import { batchfy, batchfyObject } from "../src/batchfy";
import { LocalBatchStorage } from "../src/batchfy/dataAccess/localBatchStorage";
import {
  uniqueNumber,
  mockFunction,
  mockErrorFunction,
  mockNoParamsUniqueFunction,
  mockObject,
} from "./utils";

describe("Batch Test (Default config)", () => {
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  test("Batched function returns expected right results", async () => {
    const resultReal = await mockFunction(rn1, rn2);
    const func = batchfy(mockFunction);
    const resultBatched = await func(rn1, rn2);
    expect(resultBatched).toEqual(resultReal);
  });

  test("Batched function returns expected exception results", async () => {
    expect.assertions(1);
    const batchfiedFunc = batchfy(mockErrorFunction);
    try {
      await mockErrorFunction(rn1, rn2);
    } catch (e: unknown) {
      if (e instanceof Error)
        await expect(batchfiedFunc(rn1, rn2)).rejects.toThrow(e);
    }
  });

  test("Original function is only called once (for the same context) until the promise has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = batchfy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Batched function returns the same result after the batching process finished in every call (for the same context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = batchfy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn2);
    const promise3 = func(rn1, rn2);
    expect(await promise1).toBe(await promise2);
    expect(await promise2).toBe(await promise3);
  });

  test("Batched function returns different result after the batching process finished in every call (for different context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = batchfy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn3);
    expect(await promise1).not.toBe(await promise2);
  });

  test("Original function (for the same context) is called more times if previous batch process has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = batchfy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Original function (for different context) is called same times as contexts before previous batch process has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = batchfy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Without params' functions use the same context by default", async () => {
    const spyedFunction = jest.fn(mockNoParamsUniqueFunction);
    const func = batchfy(spyedFunction);
    const promise1 = func();
    const promise2 = func();
    const promise3 = func();
    expect(await promise1).toBe(await promise2);
    expect(await promise2).toBe(await promise3);
  });

  test("Storage remove all it's promises when they have been resolved", async () => {
    const batchStorage = new LocalBatchStorage();
    const spyedFunc = jest.spyOn(batchStorage, "delete");
    const func = batchfy(mockFunction, {
      storage: () => {
        return batchStorage;
      },
    });
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    expect(spyedFunc).toBeCalledTimes(2);
  });

  test("Proxy object with batch works -> Original function is only called once (for the same context) until the promise has been resolved", async () => {
    const spyedFunction = jest.spyOn(mockObject, "mockFunction");
    batchfyObject(mockObject, "mockFunction");
    const promise1 = mockObject.mockFunction(rn1);
    const promise2 = mockObject.mockFunction(rn1);
    const promise3 = mockObject.mockFunction(rn1);
    expect(await promise1).toBe(await promise2);
    expect(await promise2).toBe(await promise3);
    expect(spyedFunction).toBeCalledTimes(1);
  });
});
