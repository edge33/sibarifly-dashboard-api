import assert from 'node:assert';
import { FastifyInstance } from 'fastify';
import tap from 'tap';

const getAuthTokenAndCookie = async (app: FastifyInstance) => {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      username: 'admin',
      password: 'admin'
    }
  });
  const body = JSON.parse(response.body);
  const cookie = response.headers['set-cookie'];

  return { token: body.token, cookie };
};

tap.test('auth', async (t) => {
  let buildApp: () => Promise<FastifyInstance>;

  t.beforeEach(async () => {
    const { default: buildApp_ } = await t.mockImport<typeof import('../../../server.js')>(
      '../../../server.js',
      {
        '../../../plugins/prismaPlugin.js': {
          default: (app: FastifyInstance) => {
            return app;
          }
        }
      }
    );
    buildApp = buildApp_;
  });

  t.test('should return Unauthorized response when credentials are invalid', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'invalid',
        password: 'invalid'
      }
    });

    t.equal(response.statusCode, 401);
  });

  t.test('should return access token and refresh token with valid credentials', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    });
    const body = JSON.parse(response.body);
    const cookie = response.headers['set-cookie'];

    t.type(body.token, 'string');
    assert.ok(cookie?.toString().includes('refreshToken'));
  });

  t.test('should return Unauthorized response when refreshToken is invalid', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refreshToken',
      headers: {
        Cookie: 'refreshToken=invalid'
      }
    });

    t.equal(response.statusCode, 401);
  });

  t.test('should return access token and refresh token with valid credentials', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    });
    const body = JSON.parse(response.body);
    const cookie = response.headers['set-cookie'];

    t.type(body.token, 'string');
    assert.ok(cookie?.toString().includes('refreshToken'));
  });

  t.test(
    'should return new access token and refresh token when issuing a valid refreshtoken',
    async () => {
      const app = await buildApp();
      const { cookie: refreshCookie } = await getAuthTokenAndCookie(app);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refreshToken',
        headers: {
          Cookie: refreshCookie
        }
      });

      const body = JSON.parse(response.body);
      const cookie = response.headers['set-cookie'];
      t.type(body.token, 'string');
      assert.ok(cookie?.toString().includes('refreshToken'));
    }
  );
});
