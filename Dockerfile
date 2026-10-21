FROM node:24-slim AS base
RUN apt-get update && apt-get install -y openssl git
RUN npm install -g pnpm@12.7.0

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
ARG VITE_API_URL
COPY frontend-revision.txt /tmp/frontend-revision.txt
RUN revision="$(cat /tmp/frontend-revision.txt)" \
    && echo "$revision" | grep -Eq '^[a-f0-9]{40}$' \
    && git init /sibarifly-landing-form \
    && cd /sibarifly-landing-form \
    && git remote add origin https://github.com/edge33/sibarifly-landing-form \
    && git fetch --depth=1 origin "$revision" \
    && git checkout --detach FETCH_HEAD
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
