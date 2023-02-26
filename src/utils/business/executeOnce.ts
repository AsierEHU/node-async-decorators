import { cachefy } from "../../cachefy";
import { GenericAsyncFunction, ArrayType } from "../../common/business/util"

async function buildOnceAdapter(asyncFunction: GenericAsyncFunction<void, any>, context: ArrayType) {
    return asyncFunction()
}

export const buildOnce = () => {
    return cachefy(
        buildOnceAdapter,
        {
            ttl: 0,
            context: (params) => params[1]
        }
    )
}