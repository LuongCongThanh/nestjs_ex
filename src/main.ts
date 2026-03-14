import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Security: Helmet (set HTTP headers)
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix(configService.get<string>('API_PREFIX') || 'api/v1', {
    exclude: ['/', 'health'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Response Transform Interceptor
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformResponseInterceptor(reflector));

  // CORS
  app.enableCors({
    origin: (configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000').split(','),
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('Production-ready ecommerce backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${configService.get<string>('API_PREFIX') || 'api/v1'}`,
  );
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Error during application bootstrap', err);
  process.exit(1);
});
