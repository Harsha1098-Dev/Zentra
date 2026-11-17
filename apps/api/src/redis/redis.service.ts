import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.warn('Redis connection retry limit reached. Falling back to in-memory store.');
              return null;
            }
            return Math.min(times * 100, 1000);
          },
        });

        this.client.on('connect', () => {
          this.isConnected = true;
          this.logger.log('Connected to Redis server');
        });

        this.client.on('error', (err) => {
          this.logger.warn(`Redis error: ${err.message}. Operating with in-memory fallback.`);
          this.isConnected = false;
        });

        await this.client.connect().catch((err) => {
          this.logger.warn(`Redis initial connect failed: ${err.message}. Using fallback.`);
        });
      } catch (error: any) {
        this.logger.warn(`Failed to initialize Redis: ${error.message}. Using fallback.`);
      }
    } else {
      this.logger.log('REDIS_URL not provided. Using in-memory store.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err: any) {
        this.logger.warn(`Redis get failed: ${err.message}`);
      }
    }

    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set failed: ${err.message}`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis del failed: ${err.message}`);
      }
    }
    this.inMemoryStore.delete(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
