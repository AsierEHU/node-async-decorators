import { GenericAsyncFunction } from "../../common";
import { parallelify } from "../../parallelify";

function parallelFunctionAdapter(
  asyncFunction: GenericAsyncFunction<void, unknown>
) {
  return asyncFunction();
}

export function executeInParallel(
  asyncFunctions: GenericAsyncFunction<void, unknown>[],
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
