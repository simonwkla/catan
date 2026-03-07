FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

RUN apt-get update -y && apt-get install -y openssl && apt-get clean && rm -rf /var/lib/apt/lists/*

FROM base AS base-dev

WORKDIR /app

RUN mkdir -p /app/artifact/catan

COPY --link package.json /app/package.json
COPY --link pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --link pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --link tsconfig.base.json /app/tsconfig.base.json
COPY --link artifact/catan/package.json /app/artifact/catan/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prefer-offline --aggregate-output --child-concurrency=8

FROM base AS pre-build

WORKDIR /app

RUN mkdir -p /app/artifact/catan

COPY --link package.json /app/package.json
COPY --link pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --link pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --link tsconfig.base.json /app/tsconfig.base.json
COPY --link artifact/catan/package.json /app/artifact/catan/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prefer-offline --ignore-scripts --aggregate-output --child-concurrency=8

COPY --link . /app

# BUILD

FROM pre-build AS build

RUN pnpm --dir artifact/catan build

RUN pnpm deploy --filter ./artifact/catan --prod /app/prod

# LINT

FROM pre-build AS lint

CMD ["sh", "-lc", "pnpm audit --audit-level critical && pnpm run ci"]

# TEST

FROM pre-build AS test

ENV NODE_ENV=test

CMD ["pnpm", "--dir", "artifact/catan", "run", "test:ci"]

# PRODUCTION

FROM base AS production

WORKDIR /app
EXPOSE 3000

ENV NODE_ENV=production

COPY --link --from=build /app/prod/node_modules /app/node_modules
COPY --link --from=build /app/prod/package.json /app/package.json
COPY --link --from=build /app/artifact/catan/build /app/build
COPY --link --from=build /app/artifact/catan/public /app/public

CMD ["pnpm", "start"]

# DEVELOPMENT

FROM base-dev AS development

WORKDIR /app
EXPOSE 3000

ENV NODE_ENV=development

CMD ["pnpm", "--dir", "artifact/catan", "dev"]

# DRIZZLE STUDIO

FROM base-dev AS drizzle-studio

WORKDIR /app
EXPOSE 4000

ENV NODE_ENV=development

CMD ["pnpm", "--dir", "artifact/catan", "drizzle:studio"]
