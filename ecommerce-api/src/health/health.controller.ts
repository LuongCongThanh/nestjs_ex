import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-01-10T10:30:00.000Z',
        database: 'connected',
        uptime: 123.456,
      },
    },
  })
  async check() {
    try {
      const isConnected = this.dataSource.isInitialized;

      return {
        status: isConnected ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        database: isConnected ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: error.message,
      };
    }
  }
}
