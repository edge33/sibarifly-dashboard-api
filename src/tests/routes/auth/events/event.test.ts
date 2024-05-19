import assert from 'node:assert';
import tap from 'tap';
import fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client/extension';
import event from '../../../../routes/events/event.js';

tap.test('event', async (t) => {
  let app: FastifyInstance;
  t.beforeEach(async () => {
    app = fastify();
    app.decorate('verifyJWT', () => Promise.resolve());
    const prisma: PrismaClient = {
      event: {
        findUnique: (query: { where: { id: number } }) => {
          if (query.where.id === 1) {
            return Promise.resolve({
              id: 1,
              date: '2024-01-01',
              registration: 'registration',
              model: 'model',
              pilotInCommand: 'pilotInCommand',
              firstOfficer: 'firstOfficer',
              paxNumber: 0,
              departure: 'departure',
              destination: 'destination',
              arrivalTime: '10:01',
              departureTime: '11:01'
            });
          }
          if (query.where.id === 2) {
            return Promise.resolve(undefined);
          }
          return Promise.reject(new Error());
        }
      }
    };
    app.decorate('prisma', prisma);
    app.register(event);
  });

  t.test('should return an event with an id', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/1'
    });

    assert.deepEqual(response.json(), {
      id: 1,
      date: '2024-01-01',
      registration: 'registration',
      model: 'model',
      pilotInCommand: 'pilotInCommand',
      firstOfficer: 'firstOfficer',
      paxNumber: 0,
      departure: 'departure',
      destination: 'destination',
      arrivalTime: '10:01',
      departureTime: '11:01'
    });
    t.equal(response.statusCode, 200);
  });

  t.test('should return 404 when event with a given id is not found', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/2'
    });

    t.equal(response.statusCode, 404);
  });

  t.test('should return 500 when event query throws', async (t) => {
    const response = await app.inject({
      method: 'GET',
      url: '/3'
    });

    t.equal(response.statusCode, 500);
  });
});
