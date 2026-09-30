# mcps.gallery

A directory of [Model Context Protocol](https://modelcontextprotocol.io) servers:
search, filter by transport/language/tag, and see install commands. Built as a
static [Astro](https://astro.build) site, deployed to GitHub Pages.

There's no database and no admin panel. Every listing is a YAML file in
[`src/data/servers/`](src/data/servers/), and new ones arrive through pull
requests. See [CONTRIBUTING.md](CONTRIBUTING.md).

## How it works

- Each server is one `.yml` file in `src/data/servers/`, validated against the
  schema in `src/content.config.ts` at build time.
- `scripts/fetch-github-stats.mjs` runs before every build, hits the GitHub API
  for each listing's repo, and writes star counts and last-commit dates to
  `src/data/github-stats.json` (gitignored, regenerated on every build). If a
  fetch fails or there's no `GITHUB_TOKEN` in scope, that server just renders
  without live stats instead of failing the build.
- `.github/workflows/validate-pr.yml` runs `npm run build` on every pull
  request, and a broken or malformed listing fails CI.
- `.github/workflows/deploy.yml` builds and deploys `main` to GitHub Pages on
  every push.

## Local development

```sh
npm install
npm run dev
```

Unauthenticated GitHub API calls are rate-limited to 60/hour, which is usually
enough to fetch stats for local development. If you hit the limit, set a
`GITHUB_TOKEN` env var with a plain public-repo-read token, or just ignore it;
cards without stats still work.

```sh
npm run build     # fetches stats, then builds to ./dist
npm run preview   # serves the built site locally
```

## Deploying

1. In the repo's GitHub Pages settings, set the source to **GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` handles the rest.
3. `public/CNAME` points the site at `mcps.gallery`; update it (and your DNS)
   if you're deploying somewhere else.

## Adding a listing

See [CONTRIBUTING.md](CONTRIBUTING.md).
