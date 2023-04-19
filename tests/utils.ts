import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import {
  GenericAsyncFunction,
  proxifyObject,
} from "../src/common/business/util";

/**
 * Utils
 */

export function wait(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

let count = 0;
export function uniqueNumber() {
  return count++;
}

export class ParallelCounter {
  private activeFunctions: number;
  private readonly activeFunctionsHistorical: number[];

  constructor() {
    this.activeFunctions = 0;
    this.activeFunctionsHistorical = [];
  }

  public wrapFunction<F extends GenericAsyncFunction>(asyncFunc: F) {
    const wrap = ((...params) => {
      const originalPromise = asyncFunc(...params);
      this.activeFunctions++;
      this.activeFunctionsHistorical.push(this.activeFunctions);
      originalPromise.finally(() => {
        this.activeFunctions--;
        this.activeFunctionsHistorical.push(this.activeFunctions);
      });
      return originalPromise;
    }) as F;
    return wrap as F;
  }

  public wrapObject<T extends object>(target: T, methodName: keyof T) {
    return proxifyObject(target, methodName, (asyncFunc) => {
      return this.wrapFunction(asyncFunc);
    });
  }

  public getParallelCount() {
    return Math.max(...this.activeFunctionsHistorical);
  }

  public getParallelFlow() {
    return [...this.activeFunctionsHistorical];
  }
}

/**
 * Mocks
 */

export function mockFunction(
  number1: number,
  number2: number
): Promise<number> {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
}

export function mockNoParamsUniqueFunction(): Promise<number> {
  return new Promise((resolve) => {
    resolve(uniqueNumber());
  });
}

export function mockErrorFunction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  number1: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  number2: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    reject(new Error("mock error"));
  });
}

class MockObject {
  private number = 3;
  async mockFunction(number: number) {
    return number + this.number;
  }
}
export const mockObject = new MockObject();

/**
 * Factories
 */

export function createRedisClient() {
  const redisClient = createClient({
    password: process.env.REDIS_PASSWORD || "",
    socket: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });
  redisClient.on("connect", () => {
    console.log("Connected to our redis instance!");
  });
  redisClient.on("error", (err: unknown) => {
    console.error("Redis Client Error", err);
  });
  return redisClient;
}
