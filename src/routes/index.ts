import { FastifyInstance } from 'fastify';
import events from './events/index.js';
import auth from './auth/index.js';

export default async (app: FastifyInstance) => {
  app.register(events, { prefix: 'events' });
  app.register(auth, { prefix: 'auth' });
};
