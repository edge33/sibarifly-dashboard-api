import { FastifyInstance } from 'fastify';

import events from './events.js';
import create from './create.js';
import event from './event.js';

export default async (app: FastifyInstance) => {
  app.register(create);
  app.register(events);
  app.register(event);
};
