import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { RedisService } from './redis.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRedisInstance: any;

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    mockRedisInstance = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn(),
      info: jest.fn(),
      // Chain-able: .on('event', handler) returns `this`
      on: jest.fn().mockReturnThis(),
    };
    return mockRedisInstance;
  });
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              if (key === 'REDIS_URL') return 'redis://localhost:6379';
              if (key === 'NODE_ENV') return 'test';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  describe('get', () => {
    it('should return the value when key exists', async () => {
      mockRedisInstance.get.mockResolvedValue('value-1');

      expect(await service.get('my-key')).toBe('value-1');
      expect(mockRedisInstance.get).toHaveBeenCalledWith('epde:my-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      expect(await service.get('missing-key')).toBeNull();
    });
  });

  describe('setex', () => {
    it('should call Redis setex with key, ttl, and value', async () => {
      mockRedisInstance.setex.mockResolvedValue('OK');

      await service.setex('my-key', 300, 'my-value');

      expect(mockRedisInstance.setex).toHaveBeenCalledWith('epde:my-key', 300, 'my-value');
    });
  });

  describe('del', () => {
    it('should call Redis del with the key', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await service.del('my-key');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('epde:my-key');
    });
  });

  describe('exists', () => {
    it('should return true when key exists (Redis returns 1)', async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      expect(await service.exists('my-key')).toBe(true);
    });

    it('should return false when key does not exist (Redis returns 0)', async () => {
      mockRedisInstance.exists.mockResolvedValue(0);

      expect(await service.exists('missing-key')).toBe(false);
    });
  });

  describe('safeExists', () => {
    it('should return boolean when Redis responds normally', async () => {
      mockRedisInstance.exists.mockResolvedValue(1);

      expect(await service.safeExists('my-key')).toBe(true);
    });

    it('should return null (graceful degradation) when Redis throws', async () => {
      mockRedisInstance.exists.mockRejectedValue(new Error('Connection refused'));

      expect(await service.safeExists('my-key')).toBeNull();
    });
  });

  describe('setnx', () => {
    it('should return true when key is set (Redis returns OK)', async () => {
      mockRedisInstance.set.mockResolvedValue('OK');

      expect(await service.setnx('lock-key', 'owner', 30)).toBe(true);
      expect(mockRedisInstance.set).toHaveBeenCalledWith('epde:lock-key', 'owner', 'EX', 30, 'NX');
    });

    it('should return false when key already exists (Redis returns null)', async () => {
      mockRedisInstance.set.mockResolvedValue(null);

      expect(await service.setnx('lock-key', 'owner', 30)).toBe(false);
    });
  });

  describe('isHealthy', () => {
    it('should return true when Redis responds to PING', async () => {
      mockRedisInstance.ping.mockResolvedValue('PONG');

      expect(await service.isHealthy()).toBe(true);
    });

    it('should return false when Redis throws on PING', async () => {
      mockRedisInstance.ping.mockRejectedValue(new Error('Connection refused'));

      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe('eval', () => {
    it('should pass script, keys, and args to Redis eval', async () => {
      mockRedisInstance.eval.mockResolvedValue(1);

      const result = await service.eval('return 1', ['key1'], ['arg1', 42]);

      // ioredis eval signature: eval(script, numkeys, ...keys, ...args)
      expect(mockRedisInstance.eval).toHaveBeenCalledWith('return 1', 1, 'epde:key1', 'arg1', 42);
      expect(result).toBe(1);
    });
  });

  describe('getMemoryInfo', () => {
    const REALISTIC_INFO = [
      '# Memory',
      'used_memory:1048576',
      'used_memory_human:1.00M',
      'used_memory_rss:2097152',
      'maxmemory:536870912',
      'maxmemory_human:512.00M',
      'maxmemory_policy:volatile-lru',
    ].join('\r\n');

    it('should parse used_memory and maxmemory from INFO output', async () => {
      mockRedisInstance.info.mockResolvedValue(REALISTIC_INFO);

      const result = await service.getMemoryInfo();

      expect(mockRedisInstance.info).toHaveBeenCalledWith('memory');
      expect(result).toEqual({
        usedMemoryBytes: 1_048_576,
        maxMemoryBytes: 536_870_912,
        usagePercentage: expect.closeTo(0.195, 2),
      });
    });

    it('should return 0% when maxmemory is 0 (no limit)', async () => {
      const noLimitInfo = '# Memory\r\nused_memory:500000\r\nmaxmemory:0';
      mockRedisInstance.info.mockResolvedValue(noLimitInfo);

      const result = await service.getMemoryInfo();

      expect(result).toEqual({
        usedMemoryBytes: 500_000,
        maxMemoryBytes: 0,
        usagePercentage: 0,
      });
    });

    it('should return null when Redis throws (graceful degradation)', async () => {
      mockRedisInstance.info.mockRejectedValue(new Error('Connection refused'));

      expect(await service.getMemoryInfo()).toBeNull();
    });
  });

  describe('isConnected getter', () => {
    it('should be false before any connection events', () => {
      expect(service.isConnected).toBe(false);
    });
  });
});
