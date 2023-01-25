var hasher = require('node-object-hash');
var hashSortCoerce = hasher({ coerce: false });

/* Storage */
class LocalCacheStorage {

    private readonly storage: { [key: string]: any }

    constructor() {
        this.storage = {}
    }

    async get(key: string): Promise<any> {
        if (!(key in this.storage))
            throw new Error(`${key} does not exist`);
        return this.storage[key]
    }

    async set(key: string, value: any, ttl: number) {
        this.storage[key] = value
        if (ttl > 0)
            setTimeout(async () => {
                await this.delete(key)
            }, ttl)
    }

    async delete(key: string) {
        delete this.storage[key];
    }
}

class BatchStorage {

    private readonly storage: { [key: string]: Promise<any> }

    constructor() {
        this.storage = {}
    }

    get(key: string): Promise<any> {
        if (!(key in this.storage))
            throw new Error(`${key} does not exist`);
        return this.storage[key]
    }

    set(key: string, promise: Promise<any>) {
        this.storage[key] = promise
    }

    delete(key: string) {
        delete this.storage[key];
    }
}

/* Bussiness*/
type GenericAsyncFunction = (...params: any) => Promise<any>


function parallelify<T extends GenericAsyncFunction>(asyncFunc: T, concurrency: number = 1): T {
    const pendingTasksQueue: any = []
    let runningPromises: number = 0

    async function nextTask() {
        while (runningPromises < concurrency && pendingTasksQueue.length) {
            const task = pendingTasksQueue.shift()
            const promise = task()
            promise.finally(() => {
                runningPromises--
                nextTask()
            })
            runningPromises++
        }
    }

    return function (...params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const task = () => {
                const promise = asyncFunc(...params)
                promise.then(resolve, reject)
                return promise
            }
            pendingTasksQueue.push(task)
            nextTask()
        })
    } as T
}

function hash(context: any): string {
    const id = hashSortCoerce.hash(context)
    return id;
}

const defaultOptions = {
    // errorBehaviour: "disableCache", //warning //custom
    storage: () => {
        return new LocalCacheStorage()
    },
    onError: (error: unknown) => {
        console.error(error)
    },
    context: (params: any) => {
        return params;
    },
    // removePattern: "ttl", //event // number of calls
    hash: (context: any) => {
        return hash(context)
    },
}

function getFinalOptions(options: any) {
    if (!options) return defaultOptions
}

function cachefy<T extends GenericAsyncFunction>(asyncFunc: T, ttl: number = 1000, options?: any): T {

    options = getFinalOptions(options)

    const cacheStorage = options.storage()
    const batchStorage = new BatchStorage()

    //to batching: must do in sync mode (from the beginning) or using concurrency 1 only with cache

    const cachefyedFunction = async function (...params: any): Promise<any> {
        const context = options.context(params)
        const key = options.hash(context)

        console.log("batch storage checking", key)



        try {
            return batchStorage.get(key)
        } catch (error) {

        }

        console.log("cache storage checking", key)

        try {
            return await cacheStorage.get(key)
        } catch (error) {

        }

        const promise = asyncFunc(...params);

        batchStorage.set(key, promise)

        promise.then(async (value) => {
            try {
                await cacheStorage.set(key, value, ttl)
            } catch (error) {
                options.onError(error)
            }
        })

        promise.finally(() => {
            console.log("batch storage removing", key)
            batchStorage.delete(key)
        })

        console.log("Returning original promise", key)
        return promise;
    } as T

    return cachefyedFunction

    // return parallelify(cachefyedFunction, 1)
}

function cachefyObject(object: any, methodName: string): void {
    const asyncFunc = object[methodName];
    if (typeof (asyncFunc) !== 'function')
        throw new Error(`Function ${methodName} not found in object`)
    const cachefyedFunction = cachefy(asyncFunc.bind(object));
    object[methodName] = cachefyedFunction
}


//test


async function startTest() {

    // new Promise((resolve) => {
    //     const a = new Promise((resolveA) => {
    //         resolveA(1)
    //     })

    //     const b = a.then(resolve)

    //     b.then((value) => {
    //         console.log("D", value)
    //     })
    //     b.finally(() => {
    //         console.log("E")
    //     })
    //     a.then((value) => {
    //         console.log("A", value)
    //         return 3
    //     })
    //     a.finally(() => {
    //         console.log("B")
    //     })

    // }).then((value) => {
    //     console.log("C", value)
    //     return 2
    // }).finally(() => {
    //     console.log("F")
    // })



    function exampleFunc(number: number): Promise<number> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(5 + number)
            }, 5000)
        })
    }

    const cacheTestFunc = cachefy(exampleFunc);

    // const cacheTestFunc = parallelify(exampleFunc, 1)

    cacheTestFunc(3).then((result) => {
        console.log(result)
    })
    cacheTestFunc(3).then((result) => {
        console.log(result)
    })
    cacheTestFunc(3).then((result) => {
        console.log(result)
    })
    // cacheTestFunc(6).then((result) => {
    //     console.log(result)
    // })
    // cacheTestFunc(6).then((result) => {
    //     console.log(result)
    // })
    // cacheTestFunc(8).then((result) => {
    //     console.log(result)
    // })
    // cacheTestFunc(8).then((result) => {
    //     console.log(result)
    // })
    // cacheTestFunc(8).then((result) => {
    //     console.log(result)
    // })


    // class TestObject {

    //     private number: number;

    //     constructor(number: number) {
    //         this.number = number
    //     }

    //     async exampleFunc(number: number): Promise<number> {
    //         return this.number + number;
    //     }
    // }

    // const testObject = new TestObject(6)

    // cachefyObject(testObject, "exampleFunc")

    // testObject.exampleFunc(5).then((result) => {
    //     console.log(result)
    // })

    // testObject.exampleFunc(5).then((result) => {
    //     console.log(result)
    // })
}

startTest()
