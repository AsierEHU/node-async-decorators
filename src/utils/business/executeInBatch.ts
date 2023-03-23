import { GenericAsyncFunction } from "../../common/business/util"

export async function executeInBatch(asyncFunctions: GenericAsyncFunction<void, any>[], batchSize: number) {
    if (batchSize <= 0)
        throw new Error("batchSize must be a positive integer")

    const chunks = [];
    for (let i = 0; i < asyncFunctions.length; i += batchSize) {
        const chunk = asyncFunctions.slice(i, i + batchSize);
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
