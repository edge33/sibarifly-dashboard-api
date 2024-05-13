import fastify from 'fastify';
import cors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cookies from '@fastify/cookie';

import routes from './routes/index.js';
import prismaPlugin from './plugins/prismaPlugin.js';
import fastifyEnvPlugin from './plugins/fastifyEnvPlugin.js';
import { HttpErrorType } from './types/index.js';
import authPlugin from './plugins/AuthPlugin.js';
import JWTPlugin from './plugins/JWTPlugin.js';

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
const env = (process.env.ENVIRONMENT as 'development' | 'production' | 'test') || 'production';

const logger = envToLogger[env];

const app = fastify({ logger }).withTypeProvider<TypeBoxTypeProvider>();

// app.setNotFoundHandler((request, reply) => {
//   // const error = createError('FST_ERR_NOT_FOUND', 'Not Found', 404)();
//   app.log.error(request.url);
//   const externalError: HttpErrorType = {
//     code: 'asdasd',
//     message: 'asdasd',
//     error: 'Not found',
//     statusCode: 404
//   };

//   reply.code(404).send(externalError);
// });

app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  /**
   * decide whether expose more detailed errors
   */
  const externalError: HttpErrorType = {
    code: 'Inteal server error',
    statusCode: 500,
    message: 'Internal server error',
    error: 'Internal server error'
  };
  reply.status(500).send(externalError);
});

/** plugins */
app.register(cookies);
app.register(cors, {
  origin: '*',
  methods: ['POST', 'GET']
});
await app.register(fastifyEnvPlugin);
if (app.config.ENVIRONMENT === 'development') {
  app.register(import('./plugins/fastifySwaggerPlugin.js'));
}
app.register(prismaPlugin);
app.register(JWTPlugin);
app.register(authPlugin);

/** routes */
app.register(routes);

app.listen({ port: Number(process.env.PORT) || 8000, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

await app.ready();
