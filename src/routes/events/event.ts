import { FastifyInstance } from 'fastify';
import { HttpError, LandingEvent } from '../../types/index.js';
import { Type } from '@sinclair/typebox';

export default async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    app.verifyJWT(request, reply);
  });

  app.get<{ Params: { eventId: number } }>(
    '/:eventId',
    {
      schema: {
        tags: ['Events'],
        params: { eventId: Type.Number() },
        response: {
          200: LandingEvent,
          404: HttpError
        }
      }
    },
    async (request, reply) => {
      const { eventId } = request.params;
      let data;
      try {
        data = await app.prisma.event.findUnique({ where: { id: eventId } });
      } catch (error) {
        app.log.error(error);
        throw new Error('Internal server error');
      }
      if (!data) {
        return reply.callNotFound();
      }
      return reply.send(data);
    }
  );

  return app;
};
