import { FastifyInstance } from 'fastify';
import { HttpError, LoginCredentials, LoginCredentialsType } from '../../types/index.js';
import { Type } from '@sinclair/typebox';

export default async (app: FastifyInstance) => {
  app.post<{ Body: LoginCredentialsType }>(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        body: LoginCredentials,
        response: {
          '200': {
            Headers: { 'Set-Cookie': Type.String() },
            token: Type.String()
          },
          '401': Type.Const('Unauthorized'),
          '500': HttpError
        }
      }
    },
    async (request, reply) => {
      const { username, password } = request.body;
      if (username === 'admin' && password === app.config.ADMIN_PASSWORD) {
        const token = await reply.authJwtSign({});
        const refreshToken = await reply.refreshJwtSign({});
        reply.setCookie('refreshToken', refreshToken, {
          domain: app.config.DOMAIN,
          path: '/',
          secure: request.protocol === 'https', // send cookie over HTTPS only
          httpOnly: true,
          sameSite: true // alternative CSRF protection,
        });
        return reply.send({ token, refreshToken });
      } else {
        reply.status(401).send('Unauthorized');
      }
    }
  );

  app.post<{ Body: LoginCredentialsType }>(
    '/refreshToken',
    {
      schema: {
        tags: ['Auth'],
        headers: { Cookie: Type.String() },
        response: {
          '200': {
            token: Type.String(),
            refreshToken: Type.String()
          },
          '401': Type.Const('Unauthorized'),
          '500': HttpError
        }
      }
    },
    async (request, reply) => {
      try {
        await request.refreshJwtVerify();
        const token = await reply.authJwtSign({});
        const refreshToken = await reply.refreshJwtSign({});
        reply.setCookie('refreshToken', refreshToken, {
          domain: app.config.DOMAIN,
          path: '/',
          secure: request.protocol === 'https', // send cookie over HTTPS only
          httpOnly: true,
          sameSite: true // alternative CSRF protection,
        });
        return reply.send({ token });
      } catch (error) {
        app.log.error(error);
        reply.status(401).send('Unauthorized');
      }
    }
  );
};
