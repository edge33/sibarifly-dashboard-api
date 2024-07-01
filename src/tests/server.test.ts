import { FastifyInstance } from 'fastify';
import tap from 'tap';
import routes from '../routes/index.js';
import fastifySwaggerPlugin from '../plugins/fastifySwaggerPlugin.js';

tap.test('server', async (t) => {
  let buildApp: () => Promise<FastifyInstance>;
  let capturedRoutes = t.captureFn(routes);
  let capturedSwagger = t.captureFn(fastifySwaggerPlugin);

  t.beforeEach(async () => {
    process.env.ENVIRONMENT = 'test';

    capturedRoutes = t.captureFn(routes);

    capturedSwagger = t.captureFn(fastifySwaggerPlugin);
    const { default: buildApp_ } = await t.mockImport<typeof import('../server.js')>(
      '../server.js',
      {
        '../plugins/prismaPlugin.js': {
          default: (app: FastifyInstance) => {
            return app;
          }
        },
        '../routes/index.js': {
          default: capturedRoutes
        },
        '../plugins/fastifySwaggerPlugin.js': {
          default: capturedSwagger
        }
      }
    );
    buildApp = buildApp_;
  });

  t.test('should return error with correct format', async (t) => {
    const app = await buildApp();

    app.get('/', async () => {
      throw new Error('test');
    });
    const response = await app.inject({
      method: 'GET',
      url: '/'
    });

    t.equal(response.statusCode, 500);
    t.same(response.json(), {
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal server error'
    });
  });

  t.test('plugins are registered', async (t) => {
    const app = await buildApp();
    app.get('/', async (request, response) => {
      t.hasProp(request, 'cookies');
      // t.hasProp(request, 'corsPreflightEnabled');

      t.hasProp(request, 'authJwtVerify');
      t.hasProp(request, 'authJwtDecode');
      t.hasProp(request, 'refreshJwtVerify');
      t.hasProp(request, 'refreshJwtDecode');

      t.hasProp(response, 'authJwtSign');
      t.hasProp(response, 'refreshJwtSign');
    });

    t.equal(capturedRoutes.calls.length, 1);

    t.hasProp(app, 'verifyJWT');
    await app.inject({
      method: 'GET',
      url: '/'
    });
  });

  t.test('registers swagger plugin in DEV mode', async (t) => {
    process.env.ENVIRONMENT = 'development';
    await buildApp();

    t.equal(capturedSwagger.calls.length, 1);
  });

  t.test('not found handler should return index.html for non-api routes', async (t) => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/test'
    });

    t.equal(response.statusCode, 200);
    t.equal(response.headers['content-type'], 'text/html; charset=UTF-8');
  });

  t.test('not found handler should return 404 for api routes', async (t) => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/test'
    });

    t.equal(response.statusCode, 404);
    t.same(response.json(), {
      message: 'Not found',
      error: 'Not found',
      statusCode: 404
    });
  });
});
