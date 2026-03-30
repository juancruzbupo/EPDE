import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request-scoped cache using AsyncLocalStorage (no Scope.REQUEST).
 *
 * Unlike Scope.REQUEST, AsyncLocalStorage does NOT propagate scope to
 * dependent services — repositories and strategies remain singletons.
 *
 * Usage in repositories:
 * ```
 * const cached = this.requestCache.get<User>('user', id);
 * if (cached) return cached;
 * const user = await this.model.findFirst({ where: { id } });
 * this.requestCache.set('user', id, user);
 * return user;
 * ```
 */
@Injectable()
export class RequestCacheService {
  private readonly storage = new AsyncLocalStorage<Map<string, unknown>>();

  /** Run a callback within a request-scoped cache context. */
  run<T>(fn: () => T): T {
    return this.storage.run(new Map(), fn);
  }

  private key(model: string, id: string): string {
    return `${model}:${id}`;
  }

  get<T>(model: string, id: string): T | undefined {
    const store = this.storage.getStore();
    if (!store) return undefined;
    return store.get(this.key(model, id)) as T | undefined;
  }

  set<T>(model: string, id: string, value: T): void {
    this.storage.getStore()?.set(this.key(model, id), value);
  }

  invalidate(model: string, id: string): void {
    this.storage.getStore()?.delete(this.key(model, id));
  }

  clear(): void {
    this.storage.getStore()?.clear();
  }
}
