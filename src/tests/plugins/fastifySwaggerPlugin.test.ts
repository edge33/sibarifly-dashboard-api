import assert from 'node:assert/strict';
import { it } from 'node:test';
import fastify from 'fastify';
import packageJson from '../../../package.json' with { type: 'json' };
import fastifySwaggerPlugin from '../../plugins/fastifySwaggerPlugin.ts';

it('serves the package release version in the OpenAPI document', async (t) => {
  const app = fastify();
  t.after(async () => {
    await app.close();
  });
  await app.register(fastifySwaggerPlugin);

  const response = await app.inject({ method: 'GET', url: '/docs/json' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().info.version, packageJson.version);
});
