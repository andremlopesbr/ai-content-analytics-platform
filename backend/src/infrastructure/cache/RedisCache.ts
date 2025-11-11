import { injectable } from 'tsyringe';
import Redis from 'ioredis';
import { AppError } from '../../shared/errors/AppError';

@injectable()
export class RedisCache {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('🔄 Connecting to Redis...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis connection error:', error.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
    } catch (error: any) {
      throw new AppError(`Failed to connect to Redis: ${error.message}`, 500);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.quit();
    } catch (error: any) {
      console.error('Error disconnecting from Redis:', error.message);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error: any) {
      console.error(`Redis GET error for key ${key}:`, error.message);
      throw new AppError(`Cache get operation failed: ${error.message}`, 500);
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error: any) {
      console.error(`Redis SET error for key ${key}:`, error.message);
      throw new AppError(`Cache set operation failed: ${error.message}`, 500);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error: any) {
      console.error(`Redis DEL error for key ${key}:`, error.message);
      throw new AppError(`Cache delete operation failed: ${error.message}`, 500);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.exists(key);
      return result > 0;
    } catch (error: any) {
      console.error(`Redis EXISTS error for key ${key}:`, error.message);
      throw new AppError(`Cache exists operation failed: ${error.message}`, 500);
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error: any) {
      console.error(`Redis EXPIRE error for key ${key}:`, error.message);
      throw new AppError(`Cache expire operation failed: ${error.message}`, 500);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      return await this.client.ttl(key);
    } catch (error: any) {
      console.error(`Redis TTL error for key ${key}:`, error.message);
      throw new AppError(`Cache ttl operation failed: ${error.message}`, 500);
    }
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error: any) {
      console.error('Redis PING error:', error.message);
      return false;
    }
  }

  getConnectionInfo(): {
    isConnected: boolean;
    status: string;
    host?: string;
    port?: number;
  } {
    return {
      isConnected: this.isConnected,
      status: this.client.status,
      host: this.client.options.host,
      port: this.client.options.port,
    };
  }

  // Additional Redis operations for cache management
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      return await this.client.keys(pattern);
    } catch (error: any) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error.message);
      throw new AppError(`Cache keys operation failed: ${error.message}`, 500);
    }
  }

  async flushAll(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.client.flushall();
    } catch (error: any) {
      console.error('Redis FLUSHALL error:', error.message);
      throw new AppError(`Cache flush operation failed: ${error.message}`, 500);
    }
  }
}