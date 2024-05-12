import { FastifyInstance } from 'fastify';
import events from './events/index.js';

export default async (app: FastifyInstance) => {
  app.register(events, { prefix: 'events' });
};
