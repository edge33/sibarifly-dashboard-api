export const envSchema = {
  type: 'object',
  required: [
    'DATABASE_URL',
    'ENVIRONMENT',
    'JWT_AUTH_TOKEN_SECRET',
    'JWT_AUTH_TOKEN_EXPIRES_IN',
    'JWT_REFRESH_TOKEN_SECRET',
    'JWT_REFRESH_TOKEN_EXPIRES_IN',
    'DOMAIN',
    'ADMIN_PASSWORD',
    'GOOGLE_CLOUD_PROJECT_ID',
    'DATABASE_ID'
  ],
  properties: {
    DATABASE_URL: {
      type: 'string'
    },
    ENVIRONMENT: {
      enum: ['development', 'production']
    },
    JWT_AUTH_TOKEN_SECRET: {
      type: 'string'
    },
    JWT_AUTH_TOKEN_EXPIRES_IN: { type: 'string' },
    JWT_REFRESH_TOKEN_SECRET: {
      type: 'string'
    },
    JWT_REFRESH_TOKEN_EXPIRES_IN: { type: 'string' },
    DOMAIN: { type: 'string' },
    ADMIN_PASSWORD: { type: 'string' },
    GOOGLE_CLOUD_PROJECT_ID: { type: 'string' },
    DATABASE_ID: { type: 'string' }
  }
};
