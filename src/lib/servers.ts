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
    .sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
}

export type ServerEntry = Awaited<ReturnType<typeof getAllServers>>[number];

export function collectFacets(servers: ServerEntry[]) {
  const languages = new Set<string>();
  const transports = new Set<string>();
  const tags = new Set<string>();
  for (const s of servers) {
    languages.add(s.language);
    for (const t of s.transports) transports.add(t);
    for (const tag of s.tags) tags.add(tag);
  }
  return {
    languages: [...languages].sort(),
    transports: [...transports].sort(),
    tags: [...tags].sort(),
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
