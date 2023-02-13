import { parallelWithRequiredOptions, parallelWithDefaultOptions, ParallelOptions, ParallelOptionsRequired } from "./parallelFactory";

export const { parallelify, parallelifyObject } = parallelWithRequiredOptions()
export { parallelWithDefaultOptions, ParallelOptions, ParallelOptionsRequired }