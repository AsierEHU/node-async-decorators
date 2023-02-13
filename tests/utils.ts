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