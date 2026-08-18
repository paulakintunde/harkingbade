import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  return rss({
    title: `${site.name} Field Notes`,
    description: 'Field notes are being rebuilt.',
    site: context.site ?? site.url,
    items: [],
    customData: `<language>${site.language}</language>`,
  });
}
