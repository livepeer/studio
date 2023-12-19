import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 60, maxKeys: 1000 });

export function cacheGet<T>(cacheKey: string) {
  return cache.get(cacheKey) as T;
}

export function cacheSet<T>(cacheKey: string, content: T) {
  cache.set(cacheKey, content);
}

export async function cacheGetOrSet<T>(
  cacheKey: string,
  getter: () => Promise<T>
) {
  let content = cacheGet<T>(cacheKey);
  if (!content) {
    content = await getter();
    cacheSet(cacheKey, content);
  }
  return content;
}
