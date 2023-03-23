import { cachefy } from "../../cachefy";
import { GenericAsyncFunction, ArrayType } from "../../common/business/util"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildOnceAdapter(asyncFunction: GenericAsyncFunction<void, any>, context: ArrayType) {
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