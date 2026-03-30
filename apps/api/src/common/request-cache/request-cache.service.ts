import { Injectable, Scope } from '@nestjs/common';

/**
 * Request-scoped cache that prevents duplicate DB queries within the same HTTP request.
 * Each HTTP request gets its own cache instance (automatically via Scope.REQUEST).
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
@Injectable({ scope: Scope.REQUEST })
export class RequestCacheService {
  private readonly cache = new Map<string, unknown>();

  private key(model: string, id: string): string {
    return `${model}:${id}`;
  }

  get<T>(model: string, id: string): T | undefined {
    return this.cache.get(this.key(model, id)) as T | undefined;
  }

  set<T>(model: string, id: string, value: T): void {
    this.cache.set(this.key(model, id), value);
  }

  invalidate(model: string, id: string): void {
    this.cache.delete(this.key(model, id));
  }

  clear(): void {
    this.cache.clear();
  }
}
