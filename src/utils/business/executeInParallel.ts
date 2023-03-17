import { GenericAsyncFunction } from "../../common/business/util"
import { parallelify } from "../../parallelify"

const parallelFunctionAdapter = async (asyncFunction: GenericAsyncFunction<void, any>) => {
    return asyncFunction()
}

export async function executeInParallel(asyncFunctions: GenericAsyncFunction<void, any>[], concurrency: number) {
    const parallelFunction = parallelify(parallelFunctionAdapter, { concurrency, contextKey: () => "" })
    const parallelFunctions = asyncFunctions.map(asyncFunction => parallelFunction(asyncFunction))
    return Promise.all(parallelFunctions)
}