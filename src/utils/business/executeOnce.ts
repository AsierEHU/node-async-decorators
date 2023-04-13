import { cachefy } from "../../cachefy";
import { GenericAsyncFunction, ArrayType } from "../../common/business/util";

function buildOnceAdapter(
  asyncFunction: GenericAsyncFunction<void, any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: ArrayType
) {
  return asyncFunction();
}

export const buildOnce = () => {
  return cachefy(buildOnceAdapter, {
    ttl: 0,
    context: (params) => params[1],
  });
};
