import { GenericAsyncFunction } from "../../common/business/util"

export async function executeInBatch(asyncFunctions: GenericAsyncFunction<void, any>[], batchNumber: number) {
    if (batchNumber <= 0)
        throw new Error("batchNumber must be a positive integer")

    const chunks = [];
    for (let i = 0; i < asyncFunctions.length; i += batchNumber) {
        const chunk = asyncFunctions.slice(i, i + batchNumber);
        chunks.push(chunk)
    }

    const results = []
    for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(asyncFunction => {
            return asyncFunction()
        }))
        results.push(...chunkResults)
    }
    return results
}
