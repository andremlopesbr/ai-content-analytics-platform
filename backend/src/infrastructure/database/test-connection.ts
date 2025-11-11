import 'reflect-metadata';
import { databaseConnection } from './connection';
import { RedisCache } from '../cache/RedisCache';

/**
 * Test connection utilities for MongoDB and Redis
 * Use this in development or health checks
 */

export async function testMongoDBConnection(): Promise<{
  success: boolean;
  message: string;
  stats?: any;
}> {
  try {
    await databaseConnection.connect();

    const isHealthy = databaseConnection.isHealthy();
    const stats = databaseConnection.getConnectionStats();

    if (isHealthy) {
      return {
        success: true,
        message: 'MongoDB connection successful',
        stats,
      };
    } else {
      return {
        success: false,
        message: `MongoDB connection in unhealthy state: ${stats.state}`,
        stats,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `MongoDB connection failed: ${error.message}`,
    };
  }
}

export async function testRedisConnection(): Promise<{
  success: boolean;
  message: string;
  info?: any;
}> {
  const redisCache = new RedisCache();

  try {
    await redisCache.connect();

    const pingResult = await redisCache.ping();
    const connectionInfo = redisCache.getConnectionInfo();

    if (pingResult) {
      return {
        success: true,
        message: 'Redis connection successful',
        info: connectionInfo,
      };
    } else {
      return {
        success: false,
        message: 'Redis ping failed',
        info: connectionInfo,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Redis connection failed: ${error.message}`,
    };
  } finally {
    await redisCache.disconnect();
  }
}

export async function testAllConnections(): Promise<{
  mongodb: { success: boolean; message: string; stats?: any };
  redis: { success: boolean; message: string; info?: any };
}> {
  console.log('🔍 Testing database connections...');

  const [mongodbResult, redisResult] = await Promise.allSettled([
    testMongoDBConnection(),
    testRedisConnection(),
  ]);

  const results = {
    mongodb: mongodbResult.status === 'fulfilled' ? mongodbResult.value : {
      success: false,
      message: `Test failed: ${mongodbResult.reason?.message || mongodbResult.reason}`,
    },
    redis: redisResult.status === 'fulfilled' ? redisResult.value : {
      success: false,
      message: `Test failed: ${redisResult.reason?.message || redisResult.reason}`,
    },
  };

  console.log('📊 Connection test results:');
  console.log(`  MongoDB: ${results.mongodb.success ? '✅' : '❌'} ${results.mongodb.message}`);
  console.log(`  Redis: ${results.redis.success ? '✅' : '❌'} ${results.redis.message}`);

  return results;
}

// CLI runner for testing connections
if (require.main === module) {
  testAllConnections()
    .then((results) => {
      const hasErrors = !results.mongodb.success || !results.redis.success;
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Connection test failed:', error);
      process.exit(1);
    });
}