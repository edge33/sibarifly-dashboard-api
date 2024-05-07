import fastify, { FastifyReply } from 'fastify';
import cors from '@fastify/cors';

const app = fastify({ logger: true });

await app.register(cors, {
  origin: '*',
  methods: ['POST', 'GET']
});

app.get('/', function (_, reply: FastifyReply) {
  return reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ hello: 'world' });
});

app.listen({ port: Number(process.env.PORT) || 8000 }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
