import { Context, GenericAsyncFunction, Key } from "../../common/business/util"

/**
 * Types and default configuration
 */
export type ParallelInput = any
export type ParallelOutput = any
export type ParallelFunc = GenericAsyncFunction<ParallelInput, ParallelOutput>
export interface TaskQueueRunnerStorage {
    getOrCreate(key: Key, constructorParams: ConstructorParameters<typeof TaskQueueRunner>): TaskQueueRunner
    get(key: Key): { value: TaskQueueRunner | undefined, found: boolean }
    set(key: Key, value: TaskQueueRunner): void
    delete(key: Key): void
}
export interface ParallelConfiguration {
    storage(): TaskQueueRunnerStorage
    onError(error: unknown): void
    context(params: ParallelInput): Context
    contextKey(context: Context): Key
    concurrency: number,
}
export type ParallelOptions = Partial<ParallelConfiguration>

/**
 * Utils
 */
type Task = () => Promise<ParallelOutput>

export class TaskQueueRunner {
    private readonly taskQueue: Task[] = []
    private runningPromises = 0
    private readonly concurrency: number
    private readonly onFinished: () => Promise<void>

    constructor(
        { concurrency, onFinished }:
            { concurrency: number, onFinished: () => Promise<void> }) {
        this.concurrency = concurrency
        this.onFinished = onFinished
    }

    push(task: Task) {
        this.taskQueue.push(task)
        this.runNextTasks()
    }

    private async runNextTasks() {
        while (this.runningPromises < this.concurrency && this.taskQueue.length) {
            const task = this.taskQueue.shift() as Task
            const promise = task()
            promise.finally(() => {
                this.runningPromises--
                if (this.taskQueue.length)
                    this.runNextTasks()
                else
                    this.onFinished().catch(() => { return })
            }).catch(() => { return })
            this.runningPromises++
        }
    }

}

/**
 * Implementation
 */
export function parallelify<T extends ParallelFunc>(asyncFunc: T, conf: ParallelConfiguration): T {
    const storage = conf.storage()

    return function (...params) {
        const context = conf.context(params)
        const key = conf.contextKey(context)

        const taskRunner = storage.getOrCreate(
            key,
            [{
                concurrency: conf.concurrency,
                onFinished: async () => {
                    try {
                        storage.delete(key)
                    }
                    catch (error) {
                        conf.onError(error)
                    }
                }
            }]
        )

        return new Promise((resolve, reject) => {
            const task: Task = () => {
                const promise = asyncFunc(...params)
                promise.then(resolve, reject)
                return promise
            }
            taskRunner.push(task)
        })
    } as T
}
