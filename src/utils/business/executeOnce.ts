import { cachefy } from "../../cachefy";
import { GenericAsyncFunction, BasicArrayType } from "../../common";

function buildOnceAdapter(
  asyncFunction: GenericAsyncFunction<void, any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: BasicArrayType
) {
  return asyncFunction();
}

export function buildOnce() {
  return cachefy(buildOnceAdapter, {
    ttl: 0,
    context: (params) => params[1],
  });
}
