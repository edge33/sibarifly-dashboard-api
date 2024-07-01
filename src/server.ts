import fastify from 'fastify';
// import cors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cookies from '@fastify/cookie';
import fastifyStatic from '@fastify/static';

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import routes from './routes/index.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import fastifyEnvPlugin from './plugins/fastifyEnvPlugin.js';
import { HttpErrorType } from './types/index.js';
import authPlugin from './plugins/authPlugin.js';
import JWTPlugin from './plugins/JWTPlugin.js';
import path from 'path';

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  production: true,
  test: false
};

const buildApp = async () => {
  const env = process.env.ENVIRONMENT as 'development' | 'production' | 'test';

  const logger = envToLogger[env];
  const app = fastify({ logger }).withTypeProvider<TypeBoxTypeProvider>();

  /** plugins */

  app.register(cookies);
  // app.register(cors, {
  //   origin: '*',
  //   methods: ['POST', 'GET']
  // });
  await app.register(fastifyEnvPlugin);
  if (app.config.ENVIRONMENT === 'development') {
    app.register(import('./plugins/fastifySwaggerPlugin.js'));
  }

  app.register(prismaPlugin);
  app.register(JWTPlugin);
  app.register(authPlugin);

  /** routes */
  app.register(routes, { prefix: '/api' });

  app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'static/')
  });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    /**
     * decide whether expose more detailed errors
     */
    const externalError: HttpErrorType = {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal server error'
    };
    reply.status(500).send(externalError);
  });

  app.setNotFoundHandler((request, reply) => {
    app.log.error(request.url);
    if (request.url.startsWith('/api')) {
      const externalError: HttpErrorType = {
        message: 'Not found',
        error: 'Not found',
        statusCode: 404
      };

      return reply.code(404).send(externalError);
    } else {
      reply.sendFile('index.html');
    }
  });

  return app;
};

export default buildApp;
