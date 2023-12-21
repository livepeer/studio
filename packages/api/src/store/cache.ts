import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 120 });

export function cacheGet<T>(cacheKey: string) {
  return cache.get(cacheKey) as T;
}

export function cacheSet<T>(
  cacheKey: string,
  content: T,
  ttl?: string | number
) {
  cache.set(cacheKey, content, ttl);
}

export async function cacheGetOrSet<T>(
  cacheKey: string,
  getter: () => Promise<T>,
  ttl?: string | number
) {
  let content = cacheGet<T>(cacheKey);
  if (!content) {
    content = await getter();
    cacheSet(cacheKey, content, ttl);
  }
  return content;
}

// Test helper to clear the cache
export function cacheFlush() {
  cache.flushAll();
}
