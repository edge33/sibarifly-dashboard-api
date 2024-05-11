import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import fastifyEnv from '@fastify/env';
import { envSchema } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: { DATABASE_URL: string; ENVIRONMENT: 'development' | 'production' };
  }
}

const fastifyEnvPlugin: FastifyPluginAsync = fp(async (server) => {
  server.register(fastifyEnv, {
    schema: envSchema,
    dotenv: true
  });
});

export default fastifyEnvPlugin;
