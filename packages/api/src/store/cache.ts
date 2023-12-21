import NodeCache from "node-cache";

class Cache {
  storage = new NodeCache({ stdTTL: 120 });

  get<T>(cacheKey: string) {
    return this.storage.get(cacheKey) as T;
  }

  set<T>(cacheKey: string, content: T, ttl?: string | number) {
    this.storage.set(cacheKey, content, ttl);
  }

  async getOrSet<T>(
    cacheKey: string,
    getter: () => Promise<T>,
    ttl?: string | number
  ) {
    let content = this.get<T>(cacheKey);
    if (!content) {
      content = await getter();
      this.set(cacheKey, content, ttl);
    }
    return content;
  }

  // Test helper to clear the cache
  flush() {
    this.storage.flushAll();
  }
}

export const cache = new Cache();
