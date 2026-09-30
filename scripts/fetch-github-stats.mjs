// Fetches star count and last-commit date for each listed repo at build time,
// so pages can show live GitHub metadata without calling the API from the browser.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { parse } from 'yaml';

const DATA_DIR = new URL('../src/data/servers/', import.meta.url);
const OUT_DIR = new URL('../src/data/', import.meta.url);
const OUT_FILE = new URL('./github-stats.json', OUT_DIR);
const token = process.env.GITHUB_TOKEN;

function repoSlugFromUrl(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

async function fetchRepoStats(slug) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const [repoRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${slug}`, { headers }),
    fetch(`https://api.github.com/repos/${slug}/commits?per_page=1`, { headers }),
  ]);

  if (!repoRes.ok) throw new Error(`${slug}: ${repoRes.status}`);
  const repo = await repoRes.json();
  const commits = commitsRes.ok ? await commitsRes.json() : [];
  const lastCommit = Array.isArray(commits) && commits[0]?.commit?.author?.date;

  return {
    stars: repo.stargazers_count ?? null,
    lastCommit: lastCommit ?? repo.pushed_at ?? null,
  };
}

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await readFile(OUT_FILE, 'utf-8'));
  } catch {
    // no cache yet, that's fine
  }

  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.yml'));
  const slugs = new Set();
  for (const file of files) {
    const raw = await readFile(new URL(file, DATA_DIR), 'utf-8');
    const doc = parse(raw);
    const slug = repoSlugFromUrl(doc.repoUrl);
    if (slug) slugs.add(slug);
  }

  const stats = { ...existing };
  let failures = 0;

  await Promise.all(
    [...slugs].map(async (slug) => {
      try {
        stats[slug] = { ...(await fetchRepoStats(slug)), fetchedAt: new Date().toISOString() };
      } catch (err) {
        failures += 1;
        console.warn(`[github-stats] keeping stale/empty data for ${slug}: ${err.message}`);
        stats[slug] ??= { stars: null, lastCommit: null, fetchedAt: null };
      }
    })
  );

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(stats, null, 2));
  console.log(`[github-stats] wrote stats for ${slugs.size} repos (${failures} failed)`);
}

await main();
