import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
export function GET(context: APIContext) {
  return rss({ title: 'Harkingbade', description: 'A quiet placeholder feed.', site: context.site ?? 'https://harkingbade.com', items: [] });
}
