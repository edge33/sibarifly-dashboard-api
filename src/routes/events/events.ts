import { FastifyInstance } from 'fastify';
import { LandingEvent } from '../../types/index.js';
import { Type } from '@sinclair/typebox';

export default async (app: FastifyInstance) => {
  app.get(
    '/',
    {
      schema: {
        tags: ['Events'],
        response: {
          200: Type.Array(LandingEvent)
        }
      }
    },
    async (request, reply) => {
      const data = await app.prisma.event.findMany();
      return reply.send(data);
    }
  );

  return app;
};
