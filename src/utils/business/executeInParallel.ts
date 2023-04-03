import { GenericAsyncFunction } from "../../common/business/util";
import { parallelify } from "../../parallelify";

function parallelFunctionAdapter(
  asyncFunction: GenericAsyncFunction<void, any>
) {
  return asyncFunction();
}

export function executeInParallel(
  asyncFunctions: GenericAsyncFunction<void, any>[],
  concurrency: number
) {
  const parallelFunction = parallelify(parallelFunctionAdapter, {
    concurrency,
    contextKey: () => "",
  });
  const promises = asyncFunctions.map((asyncFunction) =>
    parallelFunction(asyncFunction)
  );
  return Promise.all(promises);
}
