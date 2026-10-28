FROM node:24.22.1-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS base
RUN apt-get update && apt-get install -y openssl git
RUN npm install -g pnpm@12.16.1

FROM base AS prod-deps
COPY . /app
WORKDIR /app
RUN pnpm install --prod --frozen-lockfile

FROM base AS prisma-client
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile
RUN pnpm run prisma-generate

FROM base AS build-frontend
ARG WEB_APP_BRANCH
ARG VITE_API_URL
RUN git clone --depth=1 --single-branch --branch "${WEB_APP_BRANCH}" https://github.com/edge33/sibarifly-landing-form
WORKDIR /sibarifly-landing-form
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY src /app/src
COPY --from=prisma-client /app/generated /app/generated
COPY --from=build-frontend /sibarifly-landing-form/dist /app/static/

EXPOSE 8000
CMD [ "node", "src/index.ts"]
