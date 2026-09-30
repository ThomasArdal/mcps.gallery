import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const servers = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/data/servers' }),
  schema: z.object({
    name: z.string(),
    summary: z.string().max(160),
    description: z.string(),
    repoUrl: z.string().url(),
    homepageUrl: z.string().url().optional(),
    author: z.string(),
    license: z.string().optional(),
    language: z.string(),
    transports: z.array(z.enum(['stdio', 'sse', 'http'])).min(1),
    tags: z.array(z.string()).default([]),
    official: z.boolean().default(false),
    featured: z.boolean().default(false),
    installCommand: z.string().optional(),
    installConfig: z.string().optional(),
  }),
});

export const collections = { servers };
