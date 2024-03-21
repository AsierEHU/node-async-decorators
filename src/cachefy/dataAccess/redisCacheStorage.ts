import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
import { CacheOutput, CacheStorage } from "../business/interfaces";
import { Key } from "../../common";

export class RedisCacheStorage implements CacheStorage {
  private readonly client: ReturnType<typeof createClient>;
  private readonly spaceId: string;

  constructor({
    redisClient,
    spaceId,
  }: {
    redisClient: ReturnType<typeof createClient>;
    spaceId?: string;
  }) {
    this.client = redisClient;
    this.spaceId = spaceId || uuidv4();
  }

  async get(key: Key) {
    const value = await this.client.get(this.getSpacedKey(key));
    if (value === null) return { value: undefined, found: false };
    return { value: JSON.parse(value), found: true };
  }

  async set(key: Key, value: CacheOutput, ttl: number) {
    await this.client.set(this.getSpacedKey(key), JSON.stringify(value), {
      PX: ttl,
    });
  }

  async delete(key: Key) {
    await this.client.del(this.getSpacedKey(key));
  }

  private getSpacedKey(key: Key) {
    return `${this.spaceId}_${key}`;
  }
}
