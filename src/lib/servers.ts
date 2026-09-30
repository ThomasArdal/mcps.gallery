import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface GithubStats {
  stars: number | null;
  lastCommit: string | null;
}

function loadStats(): Record<string, GithubStats> {
  try {
    // process.cwd(), not import.meta.url: Vite relocates this module into a
    // build chunk during `astro build`, which breaks import.meta.url-relative
    // paths even though they resolve fine under `astro dev`.
    const filePath = path.join(process.cwd(), 'src/data/github-stats.json');
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

const stats = loadStats();

function repoSlug(repoUrl: string): string | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

export async function getAllServers() {
  const entries = await getCollection('servers');
  return entries
    .map((entry) => {
      const slug = repoSlug(entry.data.repoUrl);
      const repoStats = (slug && stats[slug]) || { stars: null, lastCommit: null };
      return {
        id: entry.id,
        ...entry.data,
        stars: repoStats.stars,
        lastCommit: repoStats.lastCommit,
      };
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.stars ?? -1) - (a.stars ?? -1));
}

export type ServerEntry = Awaited<ReturnType<typeof getAllServers>>[number];

function byCountDesc(counts: Map<string, number>) {
  return (a: string, b: string) => counts.get(b)! - counts.get(a)! || a.localeCompare(b);
}

// Tags are free-form and contributor-supplied, so the set only grows as more
// servers get added. Showing every tag that's ever been used would turn this
// into an unreadable wall of one-off chips, so we only surface tags shared by
// more than one server, most-used first, capped as a hard backstop.
const MIN_TAG_SERVERS = 2;
const MAX_TAG_CHIPS = 12;

export function collectFacets(servers: ServerEntry[]) {
  const languageCounts = new Map<string, number>();
  const transportCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  for (const s of servers) {
    languageCounts.set(s.language, (languageCounts.get(s.language) ?? 0) + 1);
    for (const t of s.transports) transportCounts.set(t, (transportCounts.get(t) ?? 0) + 1);
    for (const tag of s.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  return {
    languages: [...languageCounts.keys()].sort(byCountDesc(languageCounts)),
    transports: [...transportCounts.keys()].sort(byCountDesc(transportCounts)),
    tags: [...tagCounts.keys()]
      .filter((tag) => tagCounts.get(tag)! >= MIN_TAG_SERVERS)
      .sort(byCountDesc(tagCounts))
      .slice(0, MAX_TAG_CHIPS),
  };
}

export function relativeTime(iso: string | null): string {
  if (!iso) return 'unknown';
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
