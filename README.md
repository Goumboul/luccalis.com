# lucca-site

Personal site: notes and deep dives on databases. Built with Astro and MDX.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Write

- A note or deep dive: add `src/content/writing/<slug>.md` (or `.mdx`) with this front matter:

  ```yaml
  ---
  title: ...
  description: One sentence shown in lists and previews.
  date: 2026-11-06
  kind: note # or deep-dive
  tags: [postgresql]
  draft: false # drafts show in `npm run dev` only
  ---
  ```

- A book: add `src/content/reading/<slug>.md`:

  ```yaml
  ---
  title: Designing Data-Intensive Applications
  author: Martin Kleppmann
  status: reading # or read
  finished: 2026-12-01 # when status is read
  ---
  Your notes in Markdown.
  ```

## Deploy

Static site. On Vercel or Netlify: import the repo, framework preset Astro, no settings to change.
Update `site` in `astro.config.mjs` with the real domain.
