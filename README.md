# fastify-boilerplate

authenticate against gcloud in order to obtain the credentials

`gcloud auth application-default login `

A simple boilerplate to bootstrap a fastify app

built with [pnpm](https://pnpm.io/)

it features

- Typescript
- Biome
- Editorconfig

## Local verification

Use Node 24 and pnpm 12. The test database is defined in `docker-compose-test.yml`.
Development runs TypeScript directly with Node's built-in type stripping (`pnpm dev`); the production build still emits JavaScript with `tsc`.

```sh
docker compose -f docker-compose-test.yml up -d db
pnpm install --frozen-lockfile
pnpm prisma-generate
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
  DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
  pnpm prisma migrate deploy
pnpm lint
pnpm build
pnpm test
```
