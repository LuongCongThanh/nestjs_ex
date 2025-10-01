import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadAppConfig, validateConfig } from './config/app.config';

/**
 * Validation pipe configuration
 */
const VALIDATION_CONFIG = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  disableErrorMessages: false, // Will be set based on environment
} as const;

/**
 * Swagger CDN URLs
 */
const SWAGGER_CDN = {
  JS: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
  ],
  CSS: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  ],
};

/**
 * Configure global validation pipe
 */
function setupValidation(
  app: INestApplication,
  config: ReturnType<typeof loadAppConfig>,
): void {
  const validationConfig = {
    ...VALIDATION_CONFIG,
    disableErrorMessages: config.nodeEnv === 'production',
  };
  app.useGlobalPipes(new ValidationPipe(validationConfig));
}

/**
 * Configure CORS
 */
function setupCors(
  app: INestApplication,
  config: ReturnType<typeof loadAppConfig>,
): void {
  app.enableCors(config.cors);
}

/**
 * Setup Swagger documentation
 */
function setupSwagger(
  app: INestApplication,
  config: ReturnType<typeof loadAppConfig>,
): void {
  if (!config.swagger.enabled) {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle(config.swagger.title)
    .setDescription(config.swagger.description)
    .setVersion(config.swagger.version)
    .addTag('users', 'User Management')
    .addTag('auth', 'Authentication and Authorization')
    .addTag('todo', 'Todo Management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(config.swagger.path, app, document, {
    customSiteTitle: config.swagger.title,
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: SWAGGER_CDN.JS,
    customCssUrl: SWAGGER_CDN.CSS,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
  });
}

/**
 * Log application startup information
 */
function logStartupInfo(config: ReturnType<typeof loadAppConfig>): void {
  const logger = new Logger('Bootstrap');
  const baseUrl = `http://localhost:${config.port}`;

  logger.log(`🚀 Application is running on: ${baseUrl}`);

  if (config.swagger.enabled) {
    logger.log(`📚 Swagger documentation: ${baseUrl}/${config.swagger.path}`);
  }

  logger.log(`🌍 Environment: ${config.nodeEnv}`);
  logger.log(`🔧 CORS Origin: ${config.cors.origin}`);
}

/**
 * Bootstrap the NestJS application
 */
async function bootstrap(): Promise<void> {
  try {
    // Load and validate configuration
    const config = loadAppConfig();
    validateConfig(config);

    const app = await NestFactory.create(AppModule, {
      logger: config.logging.levels as (
        | 'verbose'
        | 'debug'
        | 'log'
        | 'warn'
        | 'error'
        | 'fatal'
      )[],
    });

    // Setup application middleware and configuration
    setupCors(app, config);
    setupValidation(app, config);
    setupSwagger(app, config);

    // Start the application
    await app.listen(config.port);

    // Log startup information
    logStartupInfo(config);
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  const logger = new Logger('Bootstrap');
  logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
void bootstrap();
