FROM node:22-slim AS base
RUN apt-get update && apt-get install -y openssl git
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build-frontend

ARG WEB_APP_BRANCH
ARG VITE_API_URL
RUN git clone --single-branch --branch ${WEB_APP_BRANCH} https://github.com/edge33/sibarifly-landing-form
WORKDIR /sibarifly-landing-form
RUN id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS prod-deps
COPY . /app
WORKDIR /app
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
COPY . /app
WORKDIR /app
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run prisma-generate
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=prod-deps /app/package.json /app/package.json
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build-frontend /sibarifly-landing-form/dist /app/static/

EXPOSE 8000
CMD [ "node", "dist/index.js"]
