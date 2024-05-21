import assert from 'node:assert';
import tap from 'tap';
import fastify, { FastifyInstance } from 'fastify';
import create from '../../../../routes/events/create.js';
import { PrismaClient } from '@prisma/client/extension';

tap.test('create', async (t) => {
  let app: FastifyInstance;
  const capturedCreate = t.captureFn((args: []) => Promise.resolve({ result: { id: 1 } }));
  t.beforeEach(async () => {
    app = fastify();
    const prisma: PrismaClient = {
      event: { create: capturedCreate }
    };
    app.decorate('prisma', prisma);
    app.register(create);
  });

  t.test('should create an event', async (t) => {
    const payload = {
      dateTime: '2024-01-01',
      eventType: 'ARRIVAL',
      aircraftType: 'GA',
      aircraftRegistration: 'registration',
      aircraftModel: 'model',
      pilotInCommand: 'pilotInCommand',
      firstOfficer: 'firstOfficer',
      departure: 'departure',
      paxNumber: 1,
      destination: 'destination',
      emailAddress: '',
      mobilePhone: '98787978'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/',
      headers: { 'content-type': 'application/json' },
      payload
    });

    const args = capturedCreate.calls[0].args[0];
    assert.deepEqual(args, {
      data: { ...payload, dateTime: new Date(payload.dateTime) }
    });

    t.equal(response.statusCode, 201);
  });

  t.test('should throw an error with invalid data', async (t) => {
    const app = fastify();
    const capturedCreate = t.captureFn(() => Promise.reject(new Error()));
    const prisma: PrismaClient = {
      event: { create: capturedCreate }
    };

    app.register(create);
    app.decorate('prisma', prisma);

    const payload = {
      dateTime: '2024-01-01T00:00:00.000Z',
      eventType: 'ARRIVAL',
      aircraftType: 'GA',
      aircraftRegistration: 'registration',
      aircraftModel: 'model',
      pilotInCommand: 'pilotInCommand',
      firstOfficer: 'firstOfficer',
      paxNumber: 1,
      departure: 'departure',
      destination: 'destination',
      mobilePhone: '98787978'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/',
      headers: { 'content-type': 'application/json' },
      payload
    });

    t.equal(response.statusCode, 500);
  });
});
