import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const failures = [];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(target) : [target];
    }),
  );
  return nested.flat();
}

function routeForFile(file) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  if (relative === 'index.html') return '/';
  if (relative === '404.html') return '/404/';
  return `/${relative.replace(/index\.html$/, '').replace(/\.html$/, '/')}`;
}

function targetForUrl(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return path.join(root, 'index.html');
  if (clean === '/404/') return path.join(root, '404.html');
  if (clean.endsWith('/')) return path.join(root, clean.slice(1), 'index.html');
  return path.join(root, clean.slice(1));
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

const files = await collectFiles(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const checkedLinks = new Set();
const checkedAnchors = new Set();
const htmlCache = new Map();

async function htmlForTarget(target) {
  if (htmlCache.has(target)) return htmlCache.get(target);
  if (!(await exists(target))) return null;
  const html = await readFile(target, 'utf8');
  htmlCache.set(target, html);
  return html;
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const route = routeForFile(file);

  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) failures.push(`${route}: expected one h1, found ${h1Count}`);
  if (!/<title>[^<]{5,}<\/title>/.test(html)) failures.push(`${route}: missing title`);
  if (!/<meta name="description" content="[^"]{50,180}"/.test(html)) {
    failures.push(`${route}: missing or invalid-length description`);
  }
  if (!/<link rel="canonical" href="https:\/\/harkingbade\.com\//.test(html)) {
    failures.push(`${route}: missing production canonical`);
  }
  if (!/<meta property="og:image" content="https:\/\/harkingbade\.com\/og-default\.png"/.test(html)) {
    failures.push(`${route}: missing production Open Graph image`);
  }
  if (!/<meta name="twitter:card" content="summary_large_image"/.test(html)) {
    failures.push(`${route}: missing large Twitter card`);
  }

  const schemaMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
  for (const match of schemaMatches) {
    try {
      JSON.parse(match[1]);
    } catch {
      failures.push(`${route}: invalid JSON-LD`);
    }
  }

  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const link of links) {
    if (link.startsWith('#') || link.startsWith('/')) {
      const parsed = new URL(link, `https://harkingbade.com${route}`);
      const fragment = decodeURIComponent(parsed.hash.slice(1));
      if (fragment) {
        const anchorKey = `${parsed.pathname}#${fragment}`;
        if (!checkedAnchors.has(anchorKey)) {
          checkedAnchors.add(anchorKey);
          const targetHtml = await htmlForTarget(targetForUrl(parsed.pathname));
          const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (!targetHtml || !new RegExp(`(?:id|name)="${escaped}"`).test(targetHtml)) {
            failures.push(`${route}: broken internal anchor ${link}`);
          }
        }
      }
    }

    if (
      !link.startsWith('/') ||
      link.startsWith('//') ||
      link.startsWith('/api/') ||
      link === '/404/'
    ) continue;

    const clean = link.split('#')[0].split('?')[0];
    if (!clean || checkedLinks.has(clean)) continue;
    checkedLinks.add(clean);
    if (!(await exists(targetForUrl(clean)))) failures.push(`${route}: broken internal target ${clean}`);
  }
}

for (const required of [
  '404.html',
  '_headers',
  '_redirects',
  'robots.txt',
  'rss.xml',
  'sitemap-index.xml',
  'site.webmanifest',
  'og-default.png',
]) {
  if (!(await exists(path.join(root, required)))) failures.push(`missing build artifact: ${required}`);
}

const notFound = await readFile(path.join(root, '404.html'), 'utf8');
if (!notFound.includes('name="robots" content="noindex, nofollow"')) {
  failures.push('/404/: missing noindex directive');
}

const openGraphImage = await readFile(path.join(root, 'og-default.png'));
if (
  openGraphImage.length < 24 ||
  openGraphImage.toString('ascii', 1, 4) !== 'PNG' ||
  openGraphImage.readUInt32BE(16) !== 1200 ||
  openGraphImage.readUInt32BE(20) !== 630
) {
  failures.push('og-default.png: expected a valid 1200x630 PNG');
}

if (failures.length) {
  console.error(`Build verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  const sizes = await Promise.all(files.map(async (file) => (await stat(file)).size));
  const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
  console.log(
    `Build verified: ${htmlFiles.length} HTML pages, ${checkedLinks.size} internal targets, ${checkedAnchors.size} anchors, ${(totalBytes / 1024).toFixed(1)} KiB total output.`,
  );
}
