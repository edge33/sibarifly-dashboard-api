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
Development, tests, and production run TypeScript directly with Node's built-in type stripping. Use `pnpm typecheck` to check types without emitting JavaScript.

```sh
docker compose -f docker-compose-test.yml up -d db
pnpm install --frozen-lockfile
pnpm prisma-generate
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
  DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres \
  pnpm prisma migrate deploy
pnpm lint
pnpm typecheck
pnpm test
```

## Versioning and releases

The release version in `package.json` is the source of truth, including the
version displayed in the OpenAPI documentation. The existing `1.0.0` version is
our baseline. We follow [Semantic Versioning](https://semver.org/):

- **Patch** (`1.0.1`): backward compatible bug fixes.
- **Minor** (`1.1.0`): backward compatible features or deprecations.
- **Major** (`2.0.0`): changes that require existing API clients to change, such as
  removing an endpoint or making an optional request field required.

Internal refactors and dependency updates do not automatically require a major
release; choose the bump based on their effect on API clients. Database migrations
are included in the corresponding application release, with deployment constraints
recorded in the changelog.

### Release workflow

1. Create a release branch and worktree from freshly fetched `origin/main`.
2. Run exactly one of `pnpm version:patch`, `pnpm version:minor`, or
   `pnpm version:major`. These commands update the package version without
   creating a commit or tag.
3. Move the entries under `Unreleased` in `CHANGELOG.md` into a section for the
   new version and date, leaving an empty `Unreleased` section. Describe breaking
   changes and required migration steps explicitly.
4. Run the local verification commands above, review the diff, and merge the
   release PR into `main` after its checks pass.
5. Tag the merged release commit with the matching version and push the tag:

   ```sh
   git tag -a v1.0.1 <merged-release-commit> -m "Release v1.0.1"
   git push origin v1.0.1
   ```

   Replace `1.0.1` and the commit placeholder with the intended release.
   `.github/workflows/release.yml` verifies a stable `vMAJOR.MINOR.PATCH` tag
   matches `package.json`, then creates a GitHub release with generated notes.

Publish a new version for subsequent changes; never move or overwrite a released
tag. Bump versions per release, rather than for every commit. GitHub releases do
not trigger deployment in this workflow; deployment remains configured in Cloud
Build. No npm publishing is required for this application.
