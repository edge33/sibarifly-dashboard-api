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

## Releases and deployments

Every merge to `main` deploys to development. Release Please maintains a release
PR containing the next version and changelog. Merge that PR when ready to release;
it creates a stable `vMAJOR.MINOR.PATCH` tag and GitHub release. Cloud Build then
promotes the release commit's successfully tested development image to production.
A GitHub release records a version; check Cloud Build for actual deployment status.

Use Conventional Commit squash-merge titles: `fix:` for patches, `feat:` for
features, and `!` or a `BREAKING CHANGE:` footer for breaking API changes. Other
commit types do not normally create releases. Review generated release notes and
include database migration requirements before merging. Never overwrite release
tags. The initial manifest uses the existing `1.0.0` package version as a baseline;
`bootstrap-sha` excludes earlier repository history from the first release.

### GitHub setup (required before enabling Release Please)

1. Create a fine-grained PAT scoped to this repository with Contents, Issues, and
   Pull requests read/write permissions; store it as the Actions secret
   `RELEASE_PLEASE_TOKEN`. A GitHub App installation token with equivalent access
   can replace it later. Do not use `GITHUB_TOKEN`: bot-created release PRs must
   trigger the existing PR checks. Set an expiry and rotate the credential.
2. Require PR checks and Conventional Commit squash-merge titles on `main`.
   Permit the release identity to create PRs, labels, tags, and releases without
   bypassing PR review. GitHub Actions needs permission to create pull requests
   if the repository's Actions settings restrict that capability.
3. Merge this configuration. Release Please will manage `package.json`,
   `.release-please-manifest.json`, and `CHANGELOG.md`; do not bump them manually.

### Cloud Build setup (required before switching deployments)

These files define pipelines, not cloud resources. Configure the repository
connection, two triggers, Secret Manager entries, and IAM in Google Cloud. Disable
old branch-based production triggers when switching, so ordinary merges cannot
deploy to production. Do not enable the new production trigger until development
has successfully run the new pipeline.

| Setting | Development | Production |
| --- | --- | --- |
| Event | Push to branch `^main$` | Push to tag `^v[0-9]+\.[0-9]+\.[0-9]+$` |
| Build configuration | `cloudbuild.yaml` | `cloudbuild.production.yaml` |
| File filters | None: every merge deploys | None |
| `_SERVICE` default | `sibarifly-dashboard-develop` | `sibarifly-dashboard-main` |
| `_REGION` default | `europe-west8` | `europe-west8` |
| `_DATABASE_URL_SECRET` | Development database URL secret name | Production database URL secret name |
| `_DIRECT_URL_SECRET` | Development direct URL secret name | Production direct URL secret name |
| `_DEV_TRIGGER_ID` | Not used | Development trigger UUID |
| `_DEV_BUILD_REGION` | Not used | Development trigger region (default `europe-west8`; use `global` if applicable) |

Set `_SERVICE` to your existing Cloud Run service names if different. Existing
Cloud Run runtime environment variables and service identities must already be
configured separately; build-time database secrets are only for migrations.
Use `ENVIRONMENT=production` for both Cloud Run services: this selects the packaged
runtime mode, while their service names and database settings select the environment.
Store database URLs in Secret Manager, not plaintext trigger substitutions. Both
triggers must use the same project and image repository. The existing `gcr.io`
image path is retained and must be backed by a working Artifact Registry
migration/repository. Cloud Build must be able to reach each database.

Use separate build service accounts. Development needs image push/read, development
Cloud Run deployment and runtime-service-account impersonation, log writing, and
access to development database secrets. Production needs image read, development
build metadata read (`cloudbuild.builds.list`/`get`), production Cloud Run deployment
and runtime-service-account impersonation, log writing, and access to production
database secrets. Only trusted administrators should edit these triggers or their
service accounts. Neither deployment identity should have unnecessary access to
the other environment's database.

Merging the release PR is the manual release decision. Optionally configure
**Require approval before build executes** on the production trigger for a separate
Cloud Build approval before any production migrations or deployment. This does
not require a manually dispatched GitHub Actions workflow.

### Image promotion and validation

The development build runs lint, type checks, and tests before building, migrates
the development database, deploys by digest, then smoke-checks the application URL.
Cloud Build records the image digest only when the complete build succeeds. Images
use `<commit SHA>-<build ID>` tags so retries cannot overwrite a previous build's
image. Keep images and build metadata for as long as releases may be promoted.

The production pipeline verifies that the tag matches `package.json`, then waits
up to 20 minutes for a successful build from the configured development trigger,
for the exact release commit on `main`. It reads the digest from that build's
recorded artifacts. A failed/missing development build blocks production before
migrations. After correcting a development failure, rerun development for that
commit, then rerun the failed production build if necessary. Production never
rebuilds the container or uses the mutable development service image as its source.

`frontend-revision.txt` pins the frontend repository commit included in each image.
Update that file in a PR to release frontend changes; changing only the frontend's
branch no longer changes this API image. The `/api` frontend URL is the same in
both environments, allowing promotion without environment-specific rebuilds.
OpenAPI reads the release version from `package.json` inside the image.

Only promote releases in increasing version order and allow one production
migration/deployment at a time; check pending/active builds before approving or
merging another release PR. Reject obsolete pending promotions. Prisma migrations
must support the application still running during rollout (expand/contract for
breaking schema changes). An application rollback does not undo database migrations.
The smoke check verifies HTTP startup, not full user acceptance; add application
specific checks as operational requirements evolve.

Verify promotion guards locally with:

```sh
python3 -m unittest discover -s scripts/tests
```
