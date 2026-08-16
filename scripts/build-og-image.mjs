import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../src/assets/og-default.svg', import.meta.url);
const destination = fileURLToPath(new URL('../public/og-default.png', import.meta.url));
const svg = await fs.readFile(source);

await sharp(svg, { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(destination);

const metadata = await sharp(destination).metadata();
if (metadata.width !== 1200 || metadata.height !== 630 || metadata.format !== 'png') {
  throw new Error(`Unexpected Open Graph output: ${metadata.width}x${metadata.height} ${metadata.format}.`);
}

console.log(`Open Graph image built: ${metadata.width}x${metadata.height} PNG.`);
