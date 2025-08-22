'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Shared hook for managing URL query parameters
 * Provides methods to add, update, or delete query search params
 */
export const useQueryParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Get the current value of a query parameter
   * @param key - The parameter key
   * @returns The parameter value or null if not found
   */
  const getParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  /**
   * Set or update a query parameter
   * @param key - The parameter key
   * @param value - The parameter value (null or undefined to remove)
   * @param options - Additional options
   */
  const setParam = useCallback((
    key: string, 
    value: string | null | undefined,
    options: { scroll?: boolean; replace?: boolean } = {}
  ) => {
    const { scroll = false, replace = false } = options;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    
    if (replace) {
      router.replace(newUrl, { scroll });
    } else {
      router.push(newUrl, { scroll });
    }
  }, [router, searchParams]);

  /**
   * Set multiple query parameters at once
   * @param updates - Object with key-value pairs to update
   * @param options - Additional options
   */
  const setParams = useCallback((
    updates: Record<string, string | null | undefined>,
    options: { scroll?: boolean; replace?: boolean } = {}
  ) => {
    const { scroll = false, replace = false } = options;
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    
    if (replace) {
      router.replace(newUrl, { scroll });
    } else {
      router.push(newUrl, { scroll });
    }
  }, [router, searchParams]);

  /**
   * Remove a query parameter
   * @param key - The parameter key to remove
   * @param options - Additional options
   */
  const removeParam = useCallback((
    key: string,
    options: { scroll?: boolean; replace?: boolean } = {}
  ) => {
    setParam(key, null, options);
  }, [setParam]);

  /**
   * Remove multiple query parameters
   * @param keys - Array of parameter keys to remove
   * @param options - Additional options
   */
  const removeParams = useCallback((
    keys: string[],
    options: { scroll?: boolean; replace?: boolean } = {}
  ) => {
    const updates = keys.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {} as Record<string, null>);
    
    setParams(updates, options);
  }, [setParams]);

  /**
   * Clear all query parameters
   * @param options - Additional options
   */
  const clearAllParams = useCallback((
    options: { scroll?: boolean; replace?: boolean } = {}
  ) => {
    const { scroll = false, replace = false } = options;
    const newUrl = window.location.pathname;
    
    if (replace) {
      router.replace(newUrl, { scroll });
    } else {
      router.push(newUrl, { scroll });
    }
  }, [router]);

  /**
   * Get all current query parameters as an object
   * @returns Object with all current query parameters
   */
  const getAllParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  /**
   * Check if a parameter exists
   * @param key - The parameter key
   * @returns True if the parameter exists
   */
  const hasParam = useCallback((key: string): boolean => {
    return searchParams.has(key);
  }, [searchParams]);

  return {
    getParam,
    setParam,
    setParams,
    removeParam,
    removeParams,
    clearAllParams,
    getAllParams,
    hasParam,
    searchParams, // Expose the raw searchParams for advanced use cases
  };
};
