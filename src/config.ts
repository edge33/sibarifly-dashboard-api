export const envSchema = {
  type: 'object',
  required: ['DATABASE_URL', 'ENVIRONMENT'],
  properties: {
    DATABASE_URL: {
      type: 'string'
    },
    ENVIRONMENT: {
      enum: ['development', 'production']
    }
  }
};
