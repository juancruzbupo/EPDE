import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
      expect(mockRedisInstance.get).toHaveBeenCalledWith('my-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      expect(await service.get('missing-key')).toBeNull();
    });
  });

  describe('set', () => {
    it('should call Redis set with key and value', async () => {
      mockRedisInstance.set.mockResolvedValue('OK');

      await service.set('my-key', 'my-value');

      expect(mockRedisInstance.set).toHaveBeenCalledWith('my-key', 'my-value');
    });
  });

  describe('setex', () => {
    it('should call Redis setex with key, ttl, and value', async () => {
      mockRedisInstance.setex.mockResolvedValue('OK');

      await service.setex('my-key', 300, 'my-value');

      expect(mockRedisInstance.setex).toHaveBeenCalledWith('my-key', 300, 'my-value');
    });
  });

  describe('del', () => {
    it('should call Redis del with the key', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await service.del('my-key');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('my-key');
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
      expect(mockRedisInstance.set).toHaveBeenCalledWith('lock-key', 'owner', 'EX', 30, 'NX');
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
      expect(mockRedisInstance.eval).toHaveBeenCalledWith('return 1', 1, 'key1', 'arg1', 42);
      expect(result).toBe(1);
    });
  });

  describe('isConnected getter', () => {
    it('should be false before any connection events', () => {
      expect(service.isConnected).toBe(false);
    });
  });
});
