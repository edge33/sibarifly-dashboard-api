export const envSchema = {
  type: 'object',
  required: [],
  properties: {
    DATABASE_URL: {
      type: 'string'
    },
    ENVIRONMENT: {
      enum: ['development', 'production', 'test']
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
    ADMIN_PASSWORD: { type: 'string' }
  }
};
