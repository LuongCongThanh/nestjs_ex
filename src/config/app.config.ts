/**
 * Application configuration module
 * Centralizes all environment variables and application settings
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  cors: {
    origin: string;
    credentials: boolean;
  };
  swagger: {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    path: string;
  };
  logging: {
    levels: string[];
  };
}

/**
 * Load and validate application configuration from environment variables
 */
export function loadAppConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const swaggerDisabled = process.env.DISABLE_SWAGGER === 'true';

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    swagger: {
      enabled: !isProduction || !swaggerDisabled,
      title: 'NestJS Example API',
      description: 'API documentation for NestJS Example project',
      version: '1.0',
      path: 'api',
    },
    logging: {
      levels: isProduction
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    },
  };
}

/**
 * Validate configuration values
 */
export function validateConfig(config: AppConfig): void {
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}`);
  }

  if (!config.nodeEnv) {
    throw new Error('NODE_ENV is required');
  }

  if (!config.swagger.title || !config.swagger.version) {
    throw new Error('Swagger configuration is incomplete');
  }
}
