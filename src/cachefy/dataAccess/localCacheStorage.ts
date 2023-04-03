import { CacheOutput, CacheStorage } from "../business/cachefy";
import { Key } from "../../common/business/util";

export class LocalCacheStorage implements CacheStorage {
  private readonly storage: Record<Key, CacheOutput>;

  constructor() {
    this.storage = {};
  }

  async get(key: Key) {
    if (!(key in this.storage)) return { value: undefined, found: false };
    return { value: this.storage[key], found: true };
  }

  async set(key: Key, value: CacheOutput, ttl: number) {
    this.storage[key] = value;
    if (ttl > 0)
      setTimeout(() => {
        this.delete(key);
      }, ttl);
  }

  async delete(key: Key) {
    delete this.storage[key];
  }
}
