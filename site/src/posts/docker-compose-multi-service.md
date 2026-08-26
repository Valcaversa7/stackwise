---
title: "Docker Compose for multi-service development, done properly"
description: "Named volumes, healthchecks, depends_on with conditions, and the environment variable pattern that keeps local and production from drifting. A working compose file with the reasoning for each line."
date: 2026-07-06
category: Tutorials
categoryKey: tutorials
author: mayacohen
tags: [post, docker, devops, tooling]
image: /assets/img/placeholder-b.svg
toc:
  - heading: "The file"
  - heading: "Healthchecks beat depends_on"
  - heading: "Volumes and the node_modules trap"
  - heading: "Environment variables without leakage"
  - heading: "Debugging the stack"
---

## The file

A realistic development stack: an API, a database, a cache and a worker, with the source mounted for hot reload.

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD}
      POSTGRES_DB: app_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app_dev"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build:
      context: .
      target: dev
    command: npm run dev
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: .
      target: dev
    command: npm run worker
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      api:
        condition: service_started

volumes:
  pgdata:
  node_modules:
```

## Healthchecks beat depends_on

`depends_on` without a condition only orders container startup. Your API will start while Postgres is still initialising, fail to connect, and crash — the single most common Compose complaint.

`condition: service_healthy` waits for the healthcheck to pass. That requires defining a healthcheck on the dependency, which is five lines and eliminates a whole category of flaky startup. The `${DB_PASSWORD:?set DB_PASSWORD}` syntax is deliberate too: it fails immediately with a clear message instead of starting Postgres with an empty password.

## Volumes and the node_modules trap

Mounting the source directory gives you hot reload. It also shadows the container's `node_modules` with your host's — which is a problem the moment your host runs a different OS or CPU architecture than the container.

The fix is the anonymous named volume:

```yaml
volumes:
  - .:/app
  - node_modules:/app/node_modules
```

The second line mounts a container-owned volume over the dependency directory, so the container's own installed modules win while your source files still sync. Delete that volume whenever `package.json` changes materially:

```bash
docker compose down -v   # nuclear: removes all volumes including the database
docker volume rm myproject_node_modules   # surgical: dependencies only
```

<div class="callout">
  <span class="callout__label">Never do this</span>
  Do not mount your source over a production image in a deployment. This pattern is for development only; a production container should contain a fixed, built artifact and no host mounts at all.
</div>

## Environment variables without leakage

Two rules. First, never commit secrets: `${DB_PASSWORD:?}` reads from the environment or a `.env` file that is in `.gitignore`. Second, commit a `.env.example` with every variable name and a placeholder value, so a new developer knows what to set.

Service names are the hostnames — `db`, `redis` — resolved by Compose's internal DNS. Never use `localhost` for a sibling service; that refers to the container itself.

## Debugging the stack

Three commands cover most problems:

```bash
docker compose ps                  # what is running, and is it healthy?
docker compose logs -f api         # tail one service
docker compose exec api sh         # shell into a running container
```

If a service is unhealthy, `docker compose describe` is not a thing — use `docker inspect` on the container and read `State.Health.Log`. It contains the last five healthcheck outputs, which usually says exactly what is wrong.


## Profiles for the services you do not always need

A stack that boots a search index, a mail catcher and a metrics collector on every `docker compose up` is a stack you will start avoiding. Profiles let you opt in:

```yaml
  mailhog:
    image: mailhog/mailhog
    profiles: ["debug"]
    ports: ["8025:8025"]

  prometheus:
    image: prom/prometheus
    profiles: ["metrics"]
```

Then `docker compose up` starts only the core, and `docker compose --profile debug up` adds the mail catcher. Nothing is deleted from the file; it simply stops being in your way.

## Override files instead of editing the main one

Local-only tweaks belong in `compose.override.yml`, which Compose merges automatically and which should be gitignored:

```yaml
services:
  api:
    ports:
      - "9229:9229"      # debugger
    environment:
      DEBUG: "app:*"
```

The committed file stays a faithful description of the stack. Your machine's peculiarities stay on your machine, and nobody has to merge them.

## When to stop using Compose

Compose is the right tool until one of three things happens: you need to schedule work across more than one host, you need rolling deploys with health-gated traffic, or your service count passes roughly fifteen and the file stops being readable.

At that point the answer is usually not Kubernetes — it is a managed container platform, or a single well-instrumented VM. Reaching for an orchestrator because a compose file got long is how a three-person team ends up maintaining a cluster.
