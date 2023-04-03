import { cacheWithDefaultOptions, RedisCacheStorage } from "../src/cachefy";
import { LocalCacheStorage } from "../src/cachefy/dataAccess/localCacheStorage";
import {
  uniqueNumber,
  mockFunction,
  mockErrorFunction,
  mockNoParamsUniqueFunction,
  mockObject,
  wait,
  createRedisClient,
} from "./utils";

describe("Cache Test (Default config)", () => {
  const { cachefy, cachefyObject } = cacheWithDefaultOptions({ ttl: 1000 });
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  test("Cached function returns expected right results", async () => {
    const resultReal = await mockFunction(rn1, rn2);
    const func = cachefy(mockFunction);
    const resultCached = await func(rn1, rn2);
    expect(resultCached).toEqual(resultReal);
  });

  test("Cached function returns expected exception results", async () => {
    const func = cachefy(mockErrorFunction);
    let errorReal: unknown = null;
    try {
      await mockErrorFunction(rn1, rn2);
    } catch (e) {
      errorReal = e;
    }
    let errorCached: unknown = null;
    try {
      await func(rn1, rn2);
    } catch (e) {
      errorCached = e;
    }
    expect(errorCached).toEqual(errorReal);
  });

  test("Original function is only called once (for the same context) until the promise has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Cached function returns the same result after the batching process finished in every call (for the same context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn2);
    const promise3 = func(rn1, rn2);
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
  });

  test("Cached function returns different result after the batching process finished in every call (for different context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn3);
    expect((await promise1) === (await promise2)).toBe(false);
  });

  test("Original function is only called once (for the same context) until the TTL has expired", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    //Batch finished but not TTL
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Original function (for the same context) is called more times if primise and TTL has expired", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    //Batch finished but not TTL
    await wait(2000);
    //TTL finished
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Original function (for different context) is called more times before promise and TTL has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Without params' functions use the same context by default", async () => {
    const spyedFunction = jest.fn(mockNoParamsUniqueFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func();
    const promise2 = func();
    const promise3 = func();
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
  });

  test("Storage is only called twice (for the same context) until the TTL has expired", async () => {
    const cacheStorage = new LocalCacheStorage();
    const spyedFunc = jest.spyOn(cacheStorage, "get");
    const func = cachefy(mockFunction, {
      storage: () => {
        return cacheStorage;
      },
    });
    await func(rn1, rn2);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunc).toBeCalledTimes(2);
  });

  test("Storage remove all it's results when TTL has been expired", async () => {
    const cacheStorage = new LocalCacheStorage();
    const spyedFunc = jest.spyOn(cacheStorage, "delete");
    const func = cachefy(mockFunction, {
      storage: () => {
        return cacheStorage;
      },
    });
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    await wait(2000);
    expect(spyedFunc).toBeCalledTimes(2);
  });

  test("Proxy object with cache works", async () => {
    //TODO: mejorar
    const spyedFunction = jest.spyOn(mockObject, "mockFunction");
    cachefyObject(mockObject, "mockFunction");
    const promise1 = mockObject.mockFunction(rn1);
    const promise2 = mockObject.mockFunction(rn1);
    const promise3 = mockObject.mockFunction(rn1);
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
    expect(spyedFunction).toBeCalledTimes(1);
  });
});

describe("Cache Test (Redis storage)", () => {
  const rn1 = uniqueNumber();
  const rn2 = uniqueNumber();
  const rn3 = uniqueNumber();

  const redisClient = createRedisClient();
  const { cachefy, cachefyObject } = cacheWithDefaultOptions({
    ttl: 1000,
    storage: () => new RedisCacheStorage({ redisClient }),
  });

  beforeAll(async () => {
    await redisClient.connect();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  test("Cached function returns expected right results", async () => {
    const resultReal = await mockFunction(rn1, rn2);
    const func = cachefy(mockFunction);
    const resultCached = await func(rn1, rn2);
    expect(resultCached).toEqual(resultReal);
  });

  test("Cached function returns expected exception results", async () => {
    const func = cachefy(mockErrorFunction);
    let errorReal: unknown = null;
    try {
      await mockErrorFunction(rn1, rn2);
    } catch (e) {
      errorReal = e;
    }
    let errorCached: unknown = null;
    try {
      await func(rn1, rn2);
    } catch (e) {
      errorCached = e;
    }
    expect(errorCached).toEqual(errorReal);
  });

  test("Original function is only called once (for the same context) until the promise has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Cached function returns the same result after the batching process finished in every call (for the same context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn2);
    const promise3 = func(rn1, rn2);
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
  });

  test("Cached function returns different result after the batching process finished in every call (for different context)", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func(rn1, rn2);
    const promise2 = func(rn1, rn3);
    expect((await promise1) === (await promise2)).toBe(false);
  });

  test("Original function is only called once (for the same context) until the TTL has expired", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    //Batch finished but not TTL
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(1);
  });

  test("Original function (for the same context) is called more times if primise and TTL has expired", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    //Batch finished but not TTL
    await wait(2000);
    //TTL finished
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Original function (for different context) is called more times before promise and TTL has been resolved", async () => {
    const spyedFunction = jest.fn(mockFunction);
    const func = cachefy(spyedFunction);
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    expect(spyedFunction).toBeCalledTimes(2);
  });

  test("Without params' functions use the same context by default", async () => {
    const spyedFunction = jest.fn(mockNoParamsUniqueFunction);
    const func = cachefy(spyedFunction);
    const promise1 = func();
    const promise2 = func();
    const promise3 = func();
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
  });

  test("Storage is only called twice (for the same context) until the TTL has expired", async () => {
    const cacheStorage = new LocalCacheStorage();
    const spyedFunc = jest.spyOn(cacheStorage, "get");
    const func = cachefy(mockFunction, {
      storage: () => {
        return cacheStorage;
      },
    });
    await func(rn1, rn2);
    await Promise.all([func(rn1, rn2), func(rn1, rn2), func(rn1, rn2)]);
    expect(spyedFunc).toBeCalledTimes(2);
  });

  test("Storage remove all it's results when TTL has been expired", async () => {
    const cacheStorage = new LocalCacheStorage();
    const spyedFunc = jest.spyOn(cacheStorage, "delete");
    const func = cachefy(mockFunction, {
      storage: () => {
        return cacheStorage;
      },
    });
    await Promise.all([func(rn1, rn2), func(rn1, rn3)]);
    await wait(2000);
    expect(spyedFunc).toBeCalledTimes(2);
  });

  test("Proxy object with cache works", async () => {
    //TODO: mejorar
    const spyedFunction = jest.spyOn(mockObject, "mockFunction");
    cachefyObject(mockObject, "mockFunction");
    const promise1 = mockObject.mockFunction(rn1);
    const promise2 = mockObject.mockFunction(rn1);
    const promise3 = mockObject.mockFunction(rn1);
    expect((await promise1) === (await promise2)).toBe(true);
    expect((await promise2) === (await promise3)).toBe(true);
    expect(spyedFunction).toBeCalledTimes(1);
  });
});
