import { FastifyInstance } from 'fastify';
import { Event } from '../../types/index.js';
import { Type } from '@sinclair/typebox';

export default async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    app.verifyJWT(request, reply);
  });

  app.get(
    '/',
    {
      schema: {
        tags: ['Events'],
        response: {
          200: Type.Array(Event)
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
