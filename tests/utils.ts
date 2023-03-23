/**
 * Utils
 */
jest.useFakeTimers()
export const wait = (time: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, time)
        jest.runAllTimers()
    })
}

let count = 0
export function uniqueNumber() {
    return count++
}

export class ParallelCounter {

    private activeFunctions: number;
    private readonly activeFunctionsHistorical: number[];

    constructor() {
        this.activeFunctions = 0;
        this.activeFunctionsHistorical = []
    }

    public wrapFunction(asyncFunc: any) {
        const wrap = (...params: any[]) => {
            const originalPromise = asyncFunc(...params)
            this.activeFunctions++;
            this.activeFunctionsHistorical.push(this.activeFunctions)
            originalPromise.finally(() => {
                this.activeFunctions--;
                this.activeFunctionsHistorical.push(this.activeFunctions)
            })
            return originalPromise
        }
        return wrap
    }

    public getParallelCount() {
        return Math.max(...this.activeFunctionsHistorical)
    }

    public getParallelFlow() {
        return [...this.activeFunctionsHistorical]
    }
}


/**
 * Mocks
 */

export const mockFunction = (number1: number, number2: number): Promise<number> => {
    return new Promise((resolve) => {
        resolve(number1 + number2)
    })
}

export const mockNoParamsUniqueFunction = (): Promise<number> => {
    return new Promise((resolve) => {
        resolve(uniqueNumber())
    })
}

export const mockErrorFunction = (number1: number, number2: number): Promise<number> => {
    return new Promise((resolve, reject) => {
        reject(number1 + number2)
    })
}

class MockObject {
    private number = 3;
    async mockFunction(number: number) {
        return number + this.number;
    }
}
export const mockObject = new MockObject