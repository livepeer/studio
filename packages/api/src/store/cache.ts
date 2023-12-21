import _ from "lodash";
import NodeCache from "node-cache";

class Cache {
  storage: NodeCache;

  init(options?: NodeCache.Options) {
    if (this.storage) {
      throw new Error("Cache already initialized");
    }

    this.storage = new NodeCache({
      stdTTL: 120,
      checkperiod: 60,
      ...options,
    });
  }

  get<T>(cacheKey: string) {
    if (!this.storage) return;

    const content = this.storage.get(cacheKey) as T;
    // always make copies in case caller mutates the object (yeah we still have that)
    return content && _.cloneDeep(content);
  }

  set<T>(cacheKey: string, content: T, ttl?: string | number) {
    if (!this.storage) return;

    content = _.cloneDeep(content);
    this.storage.set(cacheKey, content, ttl);
  }

  delete(cacheKey: string) {
    if (!this.storage) return;
    this.storage.del(cacheKey);
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
    if (!this.storage) return;
    this.storage.flushAll();
  }
}

export const cache = new Cache();
