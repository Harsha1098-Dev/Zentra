import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async checkHealth() {
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    let redisStatus = 'down';
    try {
      await this.redis.set('health_check', 'ok', 5);
      const val = await this.redis.get('health_check');
      redisStatus = val === 'ok' ? 'up' : 'down';
    } catch {
      redisStatus = 'down';
    }

    return {
      status: 'ok',
      service: 'zentra-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }
}
