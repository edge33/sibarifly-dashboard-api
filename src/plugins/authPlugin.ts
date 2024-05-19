import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = fp(async (server) => {
  server.decorate('verifyJWT', async (request, reply) => {
    try {
      await request.authJwtVerify();
    } catch (err) {
      server.log.error(err);
      reply.status(401).send('Unauthorized');
    }
  });
});

export default authPlugin;
