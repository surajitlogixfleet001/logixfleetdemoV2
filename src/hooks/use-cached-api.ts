"use client"

import { useState, useEffect, useCallback } from "react"
import { dataCache } from "@/lib/cache"
import api from "@/lib/api"

interface UseCachedApiOptions {
  ttl?: number // Time to live in milliseconds
  enabled?: boolean // Whether to fetch data automatically
}

interface UseCachedApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearCache: () => void
}

export function useCachedApi<T>(
  endpoint: string,
  cacheKey: string,
  options: UseCachedApiOptions = {},
): UseCachedApiReturn<T> {
  const { ttl, enabled = true } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedData = dataCache.get<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fetch from API if not in cache
      const response = await api.get(endpoint)
      const responseData = response.data

      // Cache the data
      dataCache.set(cacheKey, responseData, ttl)
      setData(responseData)
    } catch (err: any) {
      console.error(`Error fetching ${endpoint}:`, err)
      setError(err.response?.data?.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [endpoint, cacheKey, ttl])

  const clearCache = useCallback(() => {
    dataCache.delete(cacheKey)
  }, [cacheKey])

  const refetch = useCallback(async () => {
    // Clear cache and fetch fresh data
    clearCache()
    await fetchData()
  }, [clearCache, fetchData])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
  }
}
