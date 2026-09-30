# Contributing

mcps.gallery has no admin panel and no submission form. Every listing is a YAML
file in [`src/data/servers/`](src/data/servers/), and adding one means opening
a pull request.

## Add a listing

1. Copy [`.github/server-listing-template.yml`](.github/server-listing-template.yml)
   into `src/data/servers/`, and name it after your server, e.g. `my-server.yml`.
   The filename (without `.yml`) becomes the server's URL, so keep it lowercase,
   hyphenated, and short.
2. Fill in the fields:

   | Field | Required | Notes |
   |---|---|---|
   | `name` | yes | Display name. |
   | `summary` | yes | One sentence, ≤160 characters, shown on the card and in search results. |
   | `description` | yes | One or more paragraphs, plain text, separated by a blank line. |
   | `repoUrl` | yes | The server's source repository. |
   | `homepageUrl` | no | A docs site or landing page, if different from the repo. |
   | `author` | yes | Person or organization who maintains it. |
   | `license` | no | SPDX identifier, e.g. `MIT`. Leave out if unclear. |
   | `language` | yes | Primary implementation language. |
   | `transports` | yes | Any of `stdio`, `sse`, `http`. |
   | `tags` | yes | Free-form, lowercase, used for filtering. A handful is plenty. |
   | `official` | yes | `true` only if you maintain the underlying product or service the server wraps, not just true because you wrote the server. |
   | `featured` | yes | Leave `false`; maintainers set this. |
   | `installCommand` | no | The one-line command to run it, if there is one. |
   | `installConfig` | no | A ready-to-paste MCP client config block. |

3. Run `npm install && npm run build` locally. The build validates every
   listing against the schema in `src/content.config.ts` and fails with a
   specific error if a field is missing or malformed.
4. Open a pull request with one server per PR.

## What gets rejected

- Anything that isn't an MCP server (a product, a library that happens to be
  used *by* an MCP server, a list of servers).
- A second listing for a repository that's already here.
- `official: true` on a community-built wrapper around someone else's
  product or API.

## Editing or removing a listing

Send a pull request against the same YAML file. If a project is abandoned or
the repository is gone, open a PR deleting its file and say why in the
description.
