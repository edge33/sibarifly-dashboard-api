import { FastifyInstance } from 'fastify';
import fastifyAuth from '@fastify/auth';

import events from './events.js';
import create from './create.js';
import event from './event.js';

export default async (app: FastifyInstance) => {
  app.register(create);

  app.register(fastifyAuth).after(() => {
    app.addHook('preHandler', async (request, reply) => {
      app.verifyJWT(request, reply);
    });

    app.register(events);
    app.register(event);
  });
};
