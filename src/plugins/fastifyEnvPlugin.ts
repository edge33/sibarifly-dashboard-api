import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyEnv from '@fastify/env';
import { envSchema } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      DATABASE_URL: string;
      ENVIRONMENT: 'development' | 'production';
      JWT_AUTH_TOKEN_SECRET: string;
      JWT_AUTH_TOKEN_EXPIRES_IN: string;
      JWT_REFRESH_TOKEN_SECRET: string;
      JWT_REFRESH_TOKEN_EXPIRES_IN: string;
      DOMAIN: string;
      ADMIN_PASSWORD: string;
      GOOGLE_CLOUD_PROJECT_ID: string;
      DATABASE_ID: string;
    };
  }
}

const fastifyEnvPlugin: FastifyPluginAsync = fp(async (server) => {
  server.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true
  });
});

export default fastifyEnvPlugin;