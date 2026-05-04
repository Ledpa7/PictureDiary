const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export const getCache = (key: string) => {
    const item = cache.get(key)
    if (item && Date.now() - item.timestamp < CACHE_TTL) {
        return item.data
    }
    return null
}

export const setCache = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() })
}

export const clearCache = (keyPattern?: string) => {
    if (keyPattern) {
        for (const key of cache.keys()) {
            if (key.includes(keyPattern)) cache.delete(key)
        }
    } else {
        cache.clear()
    }
}
