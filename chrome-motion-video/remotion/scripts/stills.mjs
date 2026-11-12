// Render review stills: node scripts/stills.mjs out/stills 0 240 300 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const composition = await selectComposition({serveUrl, id: 'ChromeAI', browserExecutable});
for (const f of frames) {
  const output = path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame: Number(f), output, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  console.log('rendered', output);
}
