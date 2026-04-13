import { RequestCacheService } from './request-cache.service';

describe('RequestCacheService', () => {
  let service: RequestCacheService;

  beforeEach(() => {
    service = new RequestCacheService();
  });

  describe('outside a run() context', () => {
    it('get returns undefined — no store available', () => {
      expect(service.get('user', 'u-1')).toBeUndefined();
    });

    it('set is a no-op — does not throw', () => {
      expect(() => service.set('user', 'u-1', { id: 'u-1' })).not.toThrow();
    });

    it('invalidate is a no-op — does not throw', () => {
      expect(() => service.invalidate('user', 'u-1')).not.toThrow();
    });

    it('clear is a no-op — does not throw', () => {
      expect(() => service.clear()).not.toThrow();
    });
  });

  describe('inside a run() context', () => {
    it('set then get returns the stored value', () => {
      const user = { id: 'u-1', name: 'Ana' };
      let retrieved: unknown;

      service.run(() => {
        service.set('user', 'u-1', user);
        retrieved = service.get('user', 'u-1');
      });

      expect(retrieved).toEqual(user);
    });

    it('get returns undefined for a key that was not set', () => {
      let retrieved: unknown = 'sentinel';

      service.run(() => {
        retrieved = service.get('user', 'missing-id');
      });

      expect(retrieved).toBeUndefined();
    });

    it('invalidate removes a previously cached value', () => {
      let afterInvalidate: unknown = 'sentinel';

      service.run(() => {
        service.set('user', 'u-1', { id: 'u-1' });
        service.invalidate('user', 'u-1');
        afterInvalidate = service.get('user', 'u-1');
      });

      expect(afterInvalidate).toBeUndefined();
    });

    it('clear removes all cached values', () => {
      let afterClear: unknown = 'sentinel';

      service.run(() => {
        service.set('user', 'u-1', { id: 'u-1' });
        service.set('property', 'p-1', { id: 'p-1' });
        service.clear();
        afterClear = service.get('user', 'u-1');
      });

      expect(afterClear).toBeUndefined();
    });

    it('isolates cache between separate run() calls', () => {
      let firstRunValue: unknown;
      let secondRunValue: unknown;

      service.run(() => {
        service.set('user', 'u-1', { id: 'u-1' });
        firstRunValue = service.get('user', 'u-1');
      });

      service.run(() => {
        secondRunValue = service.get('user', 'u-1');
      });

      expect(firstRunValue).toBeDefined();
      expect(secondRunValue).toBeUndefined();
    });

    it('uses model:id as composite key — same id different models do not collide', () => {
      let userValue: unknown;
      let propertyValue: unknown;

      service.run(() => {
        service.set('user', 'shared-id', 'user-data');
        service.set('property', 'shared-id', 'property-data');
        userValue = service.get('user', 'shared-id');
        propertyValue = service.get('property', 'shared-id');
      });

      expect(userValue).toBe('user-data');
      expect(propertyValue).toBe('property-data');
    });
  });
});
