import type { IssueDifficulty } from '@/lib/types';

const CACHE_KEY = 'jira-issue-difficulties';
const CACHE_EXPIRY_DAYS = 7;

export interface CachedDifficulty extends IssueDifficulty {
  cachedAt: string;
}

export class DifficultyCache {
  private static isExpired(cachedAt: string): boolean {
    const cached = new Date(cachedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - cached.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > CACHE_EXPIRY_DAYS;
  }

  static get(issueKey: string): IssueDifficulty | null {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData) as Record<string, CachedDifficulty>;
      const cached = cache[issueKey];

      if (!cached || this.isExpired(cached.cachedAt)) {
        return null;
      }

      const { cachedAt, ...difficulty } = cached;
      return difficulty;
    } catch (error) {
      console.error('Error reading difficulty cache:', error);
      return null;
    }
  }

  static set(issueKey: string, difficulty: IssueDifficulty): void {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      const cache = cacheData ? JSON.parse(cacheData) : {};

      cache[issueKey] = {
        ...difficulty,
        cachedAt: new Date().toISOString(),
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error writing difficulty cache:', error);
    }
  }

  static getAll(): Record<string, IssueDifficulty> {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return {};

      const cache = JSON.parse(cacheData) as Record<string, CachedDifficulty>;
      const validCache: Record<string, IssueDifficulty> = {};

      Object.entries(cache).forEach(([key, value]) => {
        if (!this.isExpired(value.cachedAt)) {
          const { cachedAt, ...difficulty } = value;
          validCache[key] = difficulty;
        }
      });

      return validCache;
    } catch (error) {
      console.error('Error reading all difficulties from cache:', error);
      return {};
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing difficulty cache:', error);
    }
  }
}