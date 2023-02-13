import { batchWithRequiredOptions, batchWithDefaultOptions, BatchOptions, BatchOptionsRequired } from "./batchFactory";

export const { batchfy, batchfyObject } = batchWithRequiredOptions()
export { batchWithDefaultOptions, BatchOptions, BatchOptionsRequired }