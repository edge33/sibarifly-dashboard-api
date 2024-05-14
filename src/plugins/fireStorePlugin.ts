import fp from 'fastify-plugin';
import { Firestore } from '@google-cloud/firestore';
import { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: Firestore;
  }
}

const firestorePlugin: FastifyPluginAsync = fp(async (server) => {
  const db = new Firestore({
    projectId: server.config.GOOGLE_CLOUD_PROJECT_ID,
    databaseId: server.config.DATABASE_ID
  });

  server.decorate('db', db);
});

export default firestorePlugin;
