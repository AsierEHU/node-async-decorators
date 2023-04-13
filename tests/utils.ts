import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import { proxifyObject } from "../src/common/business/util";

/**
 * Utils
 */

// jest.useFakeTimers()
export const wait = (time: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
    // jest.runAllTimers()
  });
};

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

  public wrapFunction(asyncFunc: any) {
    const wrap = (...params: any[]) => {
      const originalPromise = asyncFunc(...params);
      this.activeFunctions++;
      this.activeFunctionsHistorical.push(this.activeFunctions);
      originalPromise.finally(() => {
        this.activeFunctions--;
        this.activeFunctionsHistorical.push(this.activeFunctions);
      });
      return originalPromise;
    };
    return wrap;
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

export const mockFunction = (
  number1: number,
  number2: number
): Promise<number> => {
  return new Promise((resolve) => {
    resolve(number1 + number2);
  });
};

export const mockNoParamsUniqueFunction = (): Promise<number> => {
  return new Promise((resolve) => {
    resolve(uniqueNumber());
  });
};

export const mockErrorFunction = (
  number1: number,
  number2: number
): Promise<number> => {
  return new Promise((resolve, reject) => {
    reject(number1 + number2);
  });
};

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

export const createRedisClient = () => {
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
  redisClient.on("error", (err: any) => {
    console.error("Redis Client Error", err);
  });
  return redisClient;
};
