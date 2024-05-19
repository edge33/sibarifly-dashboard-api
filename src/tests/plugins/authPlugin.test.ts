import fastify from 'fastify';
import tap from 'tap';
import authPlugin from '../../plugins/authPlugin.js';

tap.test('authPlugin', async (t) => {
  t.test('should decorate the server with verifyJWT method', async () => {
    const app = fastify();
    app.register(authPlugin);
    await app.ready();
    t.hasProp(app, 'verifyJWT');
  });

  t.test('should call authJwtVerify when calling verifyJWT', async () => {
    const app = fastify();
    const capturedAuthJwtVerify = t.captureFn(() => Promise.resolve());
    app.decorateRequest('authJwtVerify', capturedAuthJwtVerify);
    await app.register(authPlugin);
    app.get('/', async (request, reply) => {
      return await app.verifyJWT(request, reply);
    });
    await app.ready();
    await app.inject({
      method: 'GET',
      url: '/'
    });
    t.equal(capturedAuthJwtVerify.calls.length, 1);
  });

  t.test('should return Unauthorized response when authJwtVerify throws', async () => {
    const app = fastify();
    app.decorateRequest('authJwtVerify', () => {
      throw new Error();
    });
    await app.register(authPlugin);
    app.get('/', async (request, reply) => {
      return await app.verifyJWT(request, reply);
    });
    await app.ready();
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });
    t.equal(response.statusCode, 401);
  });
});
