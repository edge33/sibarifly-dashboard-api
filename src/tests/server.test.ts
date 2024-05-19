import { FastifyInstance } from 'fastify';
import tap from 'tap';
import routes from '../routes/index.js';
import fastifySwaggerPlugin from '../plugins/fastifySwaggerPlugin.js';

tap.test('server', async (t) => {
  let buildApp: () => Promise<FastifyInstance>;
  let capturedRoutes = t.captureFn(routes);
  let capturedSwagger = t.captureFn(fastifySwaggerPlugin);

  t.beforeEach(async () => {
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
      code: 'Internal server error',
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal server error'
    });
  });

  t.test('plugins are registered', async (t) => {
    const app = await buildApp();
    app.get('/', async (request, response) => {
      t.hasProp(request, 'cookies');
      t.hasProp(request, 'corsPreflightEnabled');

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
});
