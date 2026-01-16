import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters for security',
    'any.required': 'JWT_SECRET is required',
  }),
  JWT_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m')
    .messages({
      'string.pattern.base': 'JWT_EXPIRATION must be in format: 1d, 7d, 24h, 60m, etc.',
    }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters for security',
    'any.required': 'JWT_REFRESH_SECRET is required (must be different from JWT_SECRET)',
  }),
  JWT_REFRESH_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('30d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Upload
  MAX_FILE_SIZE: Joi.number().default(5242880), // 5MB
  UPLOAD_DEST: Joi.string().default('./uploads'),

  // Pagination
  DEFAULT_PAGE_SIZE: Joi.number().default(10),
  MAX_PAGE_SIZE: Joi.number().default(100),

  // Frontend
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  BACKEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Stateless Token Secrets
  JWT_VERIFICATION_SECRET: Joi.string().required(),
  JWT_RESET_SECRET: Joi.string().required(),

  // Email / Resend
  RESEND_API_KEY: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
  // Legacy SMTP (optional fallback, not used by Resend)
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_SECURE: Joi.boolean().optional(),
  BREVO_API_KEY: Joi.string().optional(),
  SENDGRID_API_KEY: Joi.string().optional(),
});
