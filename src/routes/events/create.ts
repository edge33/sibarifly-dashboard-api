import { FastifyInstance } from 'fastify';
import { HttpError, LandingEvent, type LandingEventType } from '../../types/index.js';
import { Type } from '@sinclair/typebox';

export default async (app: FastifyInstance) => {
  app.post<{ Body: LandingEventType }>(
    '/',
    {
      schema: {
        tags: ['Events'],
        body: LandingEvent,
        response: {
          '201': {
            Headers: {
              Location: Type.String()
            }
          },
          '500': HttpError
        }
      }
    },
    async (request, reply) => {
      const {
        date,
        registration,
        model,
        pilotInCommand,
        firstOfficer,
        paxNumber,
        departure,
        destination,
        arrivalTime,
        departureTime
      } = request.body;

      try {
        const result = await app.prisma.event.create({
          data: {
            date: new Date(date),
            registration,
            model,
            pilotInCommand,
            paxNumber,
            arrivalTime,
            departure,
            departureTime,
            destination,
            firstOfficer
          }
        });
        reply.header('location', `/events/${result.id}`);
        return reply.status(201).send();
      } catch (error) {
        app.log.error(error);
        throw new Error('Internal server error');
      }
    }
  );

  return app;
};
