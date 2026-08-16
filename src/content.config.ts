import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const evidenceSchema = z.enum([
  'case-study',
  'experiment',
  'framework',
  'field-note',
  'teardown',
]);

const insight = defineCollection({
  loader: glob({ base: './src/content/insights', pattern: '**/*.{md,mdx}' }),
  schema: z
    .object({
      title: z.string().min(20).max(90),
      description: z.string().min(50).max(180),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      pillar: z.enum(['decide', 'position', 'build', 'grow']),
      evidenceType: evidenceSchema,
      status: z.enum(['published', 'in-progress']).default('published'),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      canonical: z.url().optional(),
      sources: z.array(z.url()).default([]),
    })
    .refine((entry) => !entry.updatedAt || entry.updatedAt >= entry.publishedAt, {
      message: 'updatedAt cannot be earlier than publishedAt',
      path: ['updatedAt'],
    }),
});

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: z
    .object({
      title: z.string().min(15).max(90),
      description: z.string().min(50).max(180),
      status: z.enum(['in-progress', 'complete']),
      startedAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      disciplines: z.array(z.string()).min(2),
      outcome: z.string().min(20),
      evidenceNote: z.string().min(20),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((entry) => entry.updatedAt >= entry.startedAt, {
      message: 'updatedAt cannot be earlier than startedAt',
      path: ['updatedAt'],
    }),
});

export const collections = { insight, work };
