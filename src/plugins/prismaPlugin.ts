import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '../../generated/client/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient();

  await prisma.$connect();

  server.decorate('prisma', prisma);

  server.addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
});

export default prismaPlugin;
