import { Logger } from "../../../loggingMiddleware"

export class CacheService {
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key)
      if (!item) {
        await Logger.debug("cache", `Cache miss for key: ${key}`)
        return null
      }

      if (Date.now() > item.expiry) {
        this.cache.delete(key)
        await Logger.debug("cache", `Cache expired for key: ${key}`)
        return null
      }

      await Logger.debug("cache", `Cache hit for key: ${key}`)
      return item.data as T
    } catch (error) {
      await Logger.error("cache", `Cache get failed: ${error}`)
      return null
    }
  }

  async set(key: string, data: any, ttlSeconds = 300): Promise<void> {
    try {
      const expiry = Date.now() + ttlSeconds * 1000
      this.cache.set(key, { data, expiry })
      await Logger.debug("cache", `Cache set for key: ${key}, TTL: ${ttlSeconds}s`)
    } catch (error) {
      await Logger.error("cache", `Cache set failed: ${error}`)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key)
      await Logger.debug("cache", `Cache deleted for key: ${key}`)
    } catch (error) {
      await Logger.error("cache", `Cache delete failed: ${error}`)
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear()
      await Logger.info("cache", "Cache cleared")
    } catch (error) {
      await Logger.error("cache", `Cache clear failed: ${error}`)
    }
  }
}
