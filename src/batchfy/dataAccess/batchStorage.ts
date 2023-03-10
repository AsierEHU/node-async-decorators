import { Key } from "../../common/business/util";
import { BatchOutput, BatchStorage } from "../business/batchfy";

export class LocalBatchStorage implements BatchStorage {

    private readonly storage: Record<string, Promise<BatchOutput>>

    constructor() {
        this.storage = {}
    }

    get(key: Key) {
        if (!(key in this.storage))
            return { value: Promise.resolve(undefined), found: false }
        return { value: this.storage[key], found: true }
    }

    set(key: Key, value: Promise<BatchOutput>) {
        this.storage[key] = value
    }

    delete(key: Key) {
        delete this.storage[key];
    }
}