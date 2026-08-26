---
title: "A GitHub Actions pipeline that finishes in under four minutes"
description: "Caching done right, matrix builds trimmed to what you actually test, and the concurrency setting most projects miss. Our pipeline went from 11 minutes to 3:40 with six changes."
date: 2026-07-02
category: Tutorials
categoryKey: tutorials
author: mayacohen
tags: [post, ci-cd, github, devops]
image: /assets/img/placeholder-e.svg
toc:
  - heading: "Measure the pipeline first"
  - heading: "The workflow"
  - heading: "Caching that actually hits"
  - heading: "Concurrency: cancel the run you do not need"
  - heading: "Trimming the matrix"
---

## Measure the first pipeline first

Before optimising anything, look at where the time goes. Every job page shows per-step duration, and in almost every slow pipeline the distribution is the same: 60% dependency installation, 25% test execution, 15% everything else.

Ours was 11 minutes 20 seconds, of which 6 minutes 40 seconds was `npm ci` running from an empty cache on every push.

## The workflow

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci --prefer-offline --no-audit --no-fund

      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run build

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/
          retention-days: 7
```

Six changes took us from 11:20 to 3:40.

## Caching that actually hits

`actions/setup-node` with `cache: npm` caches the npm download cache keyed on your lockfile. The key detail is that the cache must be **restored on the same branch context it was saved from** — a cache saved on a feature branch is not visible to another feature branch by default.

For a monorepo, cache per package with a path filter, or you will invalidate the whole cache when any one package changes.

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
    restore-keys: npm-${{ runner.os }}-
```

The `restore-keys` fallback matters: a partial cache hit restores most packages and downloads the rest, which is far better than a full miss.

<div class="callout">
  <span class="callout__label">The flags nobody reads</span>
  `--prefer-offline` uses cached tarballs when available. `--no-audit` skips the advisory check that adds 20–40 seconds and belongs in a weekly scheduled job, not on every push. `--no-fund` suppresses output noise. Together: roughly 45 seconds saved per run.
</div>

## Concurrency: cancel the run you do not need

This is the single highest-value line in the file:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Push three commits in a minute and the first two runs are cancelled instead of queued. On an active repository this does not just save minutes — it means the run you actually care about starts immediately rather than waiting behind two you have already superseded.

## Trimming the matrix

A matrix across Node 18, 20 and 22 triples your cost and your wait. Do you support all three? If your `package.json` says `engines: >=20`, test 20 and 22, and let 18 fail loudly in the wild rather than silently in CI.

Better still: run the full matrix on `main` and a single version on pull requests.

```yaml
strategy:
  matrix:
    node: ${{ github.ref == 'refs/heads/main' && fromJSON('[20, 22]') || fromJSON('[20]') }}
```

The last change was the least technical: we moved the `build` step after `test` so a failing test cancels before we spend a minute building. Ordering free steps before expensive ones is worth about as much as any cache.


## Scheduled jobs belong in a separate workflow

Three things do not belong on every push: dependency audits, link checking and coverage comparison. They are slow, they fail for reasons unrelated to your change, and they make a green build red for something you cannot fix in the branch.

```yaml
name: Nightly
on:
  schedule:
    - cron: "20 3 * * *"
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npx lychee --no-progress "./**/*.md"
```

The pull-request pipeline then only tests what the pull request could have broken. Ours went from eleven failures a month that nobody acted on to about one, which we did act on.

## Caching the Docker layer too

If your tests run in containers, the image build dominates. Cache the buildx layers explicitly:

```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    context: .
    cache-from: type=gha
    cache-to: type=gha,mode=max
    load: true
```

`mode=max` caches intermediate layers, not just the final image. On our API image that turned a 2:40 build into 25 seconds on a warm cache.

## The last 40 seconds

Two small things closed the remaining gap. First, run lint and typecheck in parallel jobs rather than sequentially — they are independent, and the runner has spare capacity. Second, set a `timeout-minutes` on every job. A hung job otherwise burns the full six-hour default, and you will not notice until the bill arrives.

The end state: 3:40 on a cold cache, 2:15 warm, and a cancelled run whenever a newer commit supersedes the one in flight.
