"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors({
        origin: (configService.get('CORS_ORIGIN') || 'http://localhost:3000').split(','),
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Ecommerce API')
        .setDescription('Production-ready ecommerce backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/${configService.get('API_PREFIX') || 'api/v1'}`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map