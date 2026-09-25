// ============================================================
// Storage — thin localStorage wrapper
// Namespaced keys, JSON-safe, try/catch everywhere
// SSR-safe: guards against missing localStorage on server
// ============================================================

const NAMESPACE = 'mountainroute';

function nsKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!isBrowser()) return fallback;
    try {
      const raw = localStorage.getItem(nsKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(nsKey(key), JSON.stringify(value));
    } catch (e) {
      console.warn(`[storage] Failed to set "${key}":`, e);
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(nsKey(key));
    } catch (e) {
      console.warn(`[storage] Failed to remove "${key}":`, e);
    }
  },

  keys(): string[] {
    if (!isBrowser()) return [];
    try {
      const all: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NAMESPACE + ':')) {
          all.push(k.slice(NAMESPACE.length + 1));
        }
      }
      return all;
    } catch {
      return [];
    }
  },

  clear(): void {
    if (!isBrowser()) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(NAMESPACE + ':')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[storage] Failed to clear:', e);
    }
  },
};
