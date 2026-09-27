import type { FastifyInstance } from 'fastify';
import auth from './auth/index.js';
import events from './events/index.js';

export default async (app: FastifyInstance) => {
  app.register(events, { prefix: 'events' });
  app.register(auth, { prefix: 'auth' });
};
