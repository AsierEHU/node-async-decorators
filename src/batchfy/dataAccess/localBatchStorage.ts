import { Key } from "../../common";
import { BatchOutput, BatchStorage } from "../business/interfaces";

export class LocalBatchStorage implements BatchStorage {
  private readonly storage: Record<Key, Promise<BatchOutput>>;

  constructor() {
    this.storage = {};
  }

  get(key: Key) {
    if (!(key in this.storage))
      return { value: Promise.resolve(undefined), found: false };
    return { value: this.storage[key], found: true };
  }

  set(key: Key, value: Promise<BatchOutput>) {
    this.storage[key] = value;
  }

  delete(key: Key) {
    delete this.storage[key];
  }
}
