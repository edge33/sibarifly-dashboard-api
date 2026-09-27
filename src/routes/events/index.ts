import type { FastifyInstance } from 'fastify';
import create from './create.js';
import event from './event.js';
import events from './events.js';

export default async (app: FastifyInstance) => {
  app.register(create);
  app.register(events);
  app.register(event);
};
