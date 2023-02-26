import hasher from 'node-object-hash';
const hashSortCoerce = hasher({ coerce: false, sort: false });

export function hash(context: Context): Key {
    const key = hashSortCoerce.hash(context)
    return key;
}

export type GenericAsyncFunction<I, O> = (...params: I[]) => Promise<O>

export function configBuilder<T>(options: Partial<T> | undefined, defaultConfiguration: T): T {
    if (!options) return defaultConfiguration
    return {
        ...defaultConfiguration,
        ...options
    }
}

export type Key = string

export function proxifyObject<T extends object>(target: T, methodName: keyof T, proxy: (targetMethod: GenericAsyncFunction<any, any>) => GenericAsyncFunction<any, any>): void {
    const asyncFunc = target[methodName]
    if (typeof (asyncFunc) !== 'function')
        throw new Error(`Function ${String(methodName)} not found in object`)
    const proxyfiedFunction = proxy(asyncFunc.bind(target));
    target[methodName] = proxyfiedFunction as T[keyof T]
}

export type BasicType = number | string | boolean | null
export type ArrayType = Array<BasicType>
export type DictionaryType = Record<string, BasicType | ArrayType>
export type Context = BasicType | ArrayType | DictionaryType