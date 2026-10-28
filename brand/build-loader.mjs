/** Trace the exact outlined Arabic wordmark with pressure-varying reveal masks.
 * Offline only: @playwright/test, Chromium and ffmpeg. No runtime font.
 * Edit the pen paths/timings below, not the finished logo outlines.
 */
import { chromium } from '@playwright/test';
import { readFile, mkdtemp, rm, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
export const motion = { fps: 25, frames: 90, clearAt: 3.44 };
// Contour indices in the source SVG: qaf=1, seen=2, noon dot=3, noon=4.
// Width knots are [fraction of pen travel, nib diameter] in the 144×112 view box.
// Connected letters share end points; only the final noon dot lifts the pen.
export const strokes = [
  { part: 4, name: 'noon', start: .08, end: .52,
    d: 'M123 28 C120 35 122 42 120.5 47 C119 54 110 57 100 58.5',
    widths: [[0, 2], [.15, 14], [1, 14]] },
  { part: 2, name: 'seen-first-rise', start: .52, end: .60,
    d: 'M100 58.5 Q104 54 105.9 44.1', widths: [[0, 14], [.4, 4], [1, 3]] },
  { part: 2, name: 'seen-first-return', start: .60, end: .72,
    d: 'M105.9 44.1 C105.5 51.5 104.2 56 100.7 57.7', widths: [[0, 3], [.45, 11], [.75, 16], [1, 16]] },
  { part: 2, name: 'seen-second-rise', start: .72, end: .80,
    d: 'M100.7 57.7 Q98.3 59 97.8 47.2', widths: [[0, 16], [.4, 4], [1, 3]] },
  { part: 2, name: 'seen-second-return', start: .80, end: .92,
    d: 'M97.8 47.2 Q98 57.5 93.8 60', widths: [[0, 3], [.45, 11], [.75, 16], [1, 16]] },
  { part: 2, name: 'seen-third-rise', start: .92, end: 1,
    d: 'M93.8 60 Q88.4 63 87.5 49.4', widths: [[0, 16], [.4, 4], [1, 3]] },
  { part: 2, name: 'seen-third-return', start: 1, end: 1.12,
    d: 'M87.5 49.4 Q87.8 59.4 82 60.8', widths: [[0, 3], [.45, 11], [.75, 16.5], [1, 16]] },
  { part: 2, name: 'seen-join', start: 1.12, end: 1.24,
    d: 'M82 60.8 Q74 61.5 65 64.5', widths: [[0, 16], [1, 16]] },
  { part: 1, name: 'qaf-head-rise', start: 1.24, end: 1.42,
    d: 'M65 64.5 C64 61 62.8 54.5 60.5 55.2', widths: [[0, 12], [1, 16]] },
  { part: 1, name: 'qaf-head-turn', start: 1.42, end: 1.56,
    d: 'M60.5 55.2 Q56.8 60.5 55.2 65.6', widths: [[0, 16], [1, 16]] },
  { part: 1, name: 'qaf-head-return', start: 1.56, end: 1.68,
    d: 'M55.2 65.6 Q58 69 64.6 65.3', widths: [[0, 16], [1, 16]] },
  { part: 1, name: 'qaf-bowl', start: 1.68, end: 2.04,
    d: 'M64.6 65.3 C67 76 60 87.2 50 91.5 C38 96 31 92 31.8 81', widths: [[0, 16], [1, 16]] },
  { part: 1, name: 'qaf-terminal', start: 2.04, end: 2.24,
    d: 'M31.8 81 Q32.3 75 33.4 69.3 Q23 71.2 16.6 82.4', widths: [[0, 16], [.45, 16], [1, 4]] },
  { part: 3, name: 'noon-dot', start: 2.36, end: 2.56,
    d: 'M124.8 14.5 L115.5 23.5', widths: [[0, 2], [.1, 13], [1, 13]] },
];

export async function prepareScene(page, source) {
  const mark = source.match(/<path\b[^>]*\/>/)?.[0];
  const outlines = mark?.match(/\bd="([^"]+)"/)?.[1].match(/M[^M]+/g);
  const transform = mark?.match(/\btransform="([^"]+)"/)?.[1];
  const color = mark?.match(/\bfill="([^"]+)"/)?.[1];
  if (outlines?.length !== 5 || !transform || !color) {
    throw new Error('Wordmark outline changed: review the handwriting paths before regenerating.');
  }
  const parts = [4, 2, 1, 3];
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:256px;height:256px}</style>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 112">
      <defs>${parts.map(part => `<clipPath id="letter-${part}"><path transform="${transform}" d="${outlines[part]}"/></clipPath>`).join('')}</defs>
      <g id="ink" fill="${color}">${parts.map(part => `<path data-part="${part}" clip-path="url(#letter-${part})"/>`).join('')}</g>
    </svg>`);
  await page.evaluate(strokes => {
    const widthAt = (knots, at) => {
      for (let i = 1; i < knots.length; i++) {
        if (at <= knots[i][0]) {
          const [a, b] = [knots[i - 1], knots[i]];
          return a[1] + (b[1] - a[1]) * (at - a[0]) / (b[0] - a[0]);
        }
      }
      return knots.at(-1)[1];
    };
    window.penStrokes = strokes.map(stroke => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', stroke.d);
      const length = path.getTotalLength();
      const count = Math.ceil(length / .22);
      const points = Array.from({ length: count + 1 }, (_, index) => {
        const at = index / count;
        const point = path.getPointAtLength(length * at);
        const radius = widthAt(stroke.widths, at) / 2;
        // Each small stamp accumulates ink along the pen's curve. The letter clip
        // preserves the exact Aref outline and prevents ink leaking into neighbors.
        const x = point.x.toFixed(3), y = point.y.toFixed(3), r = radius.toFixed(3);
        return `M${x} ${y}m-${r} 0a${r} ${r} 0 1 0 ${radius * 2} 0a${r} ${r} 0 1 0 -${radius * 2} 0Z`;
      });
      return { ...stroke, points };
    });
  }, strokes);
}

export async function drawFrame(page, seconds) {
  await page.evaluate(({ seconds, clearAt }) => {
    const parts = new Map([4, 2, 1, 3].map(part => [part, '']));
    if (seconds < clearAt) {
      for (const stroke of window.penStrokes) {
        const progress = Math.max(0, Math.min(1, (seconds - stroke.start) / (stroke.end - stroke.start)));
        if (!progress) continue;
        const count = Math.ceil(progress * stroke.points.length);
        parts.set(stroke.part, parts.get(stroke.part) + stroke.points.slice(0, count).join(''));
      }
    }
    for (const [part, d] of parts) document.querySelector(`[data-part="${part}"]`).setAttribute('d', d);
  }, { seconds, clearAt: motion.clearAt });
}

async function verifyFinishedWordmark(page, source) {
  const end = Math.max(...strokes.map(stroke => stroke.end));
  if (end >= motion.clearAt) throw new Error('The word must finish before the loop clears.');
  await drawFrame(page, end);
  const result = await page.evaluate(async source => {
    const rasterize = async svg => {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 144 * 4;
      canvas.height = 112 * 4;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const [reference, traced] = await Promise.all([
      rasterize(source),
      rasterize(new XMLSerializer().serializeToString(document.querySelector('svg'))),
    ]);
    let interior = 0, missing = 0;
    for (let i = 3; i < reference.length; i += 4) {
      // Ignore boundary antialiasing; every solid interior pixel must be inked.
      if (reference[i] >= 250) {
        interior++;
        if (traced[i] < 235) missing++;
      }
    }
    return { interior, missing };
  }, source);
  if (!result.interior || result.missing) {
    throw new Error(`Incomplete handwriting mask: ${result.missing}/${result.interior} interior pixels missing.`);
  }
  console.log(`Finished outline verified: ${result.interior} interior pixels, no missing ink.`);
}

async function build() {
  const temp = await mkdtemp(join(tmpdir(), 'nasaq-handwriting-'));
  const proof = process.argv.includes('--proof') ? resolve(root, '../.artifacts/handwriting') : null;
  if (proof) await mkdir(proof, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.NASAQ_CHROMIUM || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
    for (const [name, source] of [['nasaq-loader', 'nasaq-wordmark.svg'], ['nasaq-loader-white', 'nasaq-wordmark-white.svg']]) {
      const original = await readFile(join(root, 'assets', source), 'utf8');
      await prepareScene(page, original);
      await verifyFinishedWordmark(page, original);
      for (let frame = 0; frame < motion.frames; frame++) {
        await drawFrame(page, frame / motion.fps);
        const path = join(temp, `frame-${String(frame).padStart(3, '0')}.png`);
        await page.screenshot({ path, omitBackground: true });
        if (proof && name === 'nasaq-loader') await copyFile(path, join(proof, `frame-${String(frame).padStart(3, '0')}.png`));
      }
      for (const size of [128, 256]) {
        const output = join(root, 'assets', `${name}${size === 256 ? '-256' : ''}.gif`);
        const filter = `scale=${size}:${size}:flags=lanczos,split[a][b];[a]palettegen=max_colors=32:reserve_transparent=1[p];[b][p]paletteuse=dither=none:alpha_threshold=128`;
        execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(motion.fps), '-i', join(temp, 'frame-%03d.png'), '-filter_complex', filter, '-loop', '0', '-gifflags', '0', output]);
        await copyFile(output, output.replace('nasaq-loader', 'nasaq-wordmark-loader'));
        console.log(output);
      }
    }
    if (proof) {
      const times = [.16, .36, .56, .72, .92, 1.16, 1.4, 1.64, 1.88, 2.16, 2.44, 2.8];
      await page.setViewportSize({ width: 1024, height: 840 });
      await page.setContent(`<style>body{margin:0;background:#f7f5ee;color:#142d30;font:16px system-ui;display:grid;grid-template-columns:repeat(4,1fr)}figure{margin:0;text-align:center}img{display:block;width:256px;height:256px}figcaption{height:24px}</style>${times.map(t => `<figure><img alt="Handwriting at ${t.toFixed(2)} seconds"><figcaption>${t.toFixed(2)} s</figcaption></figure>`).join('')}`);
      const frames = await Promise.all(times.map(t => readFile(join(proof, `frame-${String(Math.round(t * motion.fps)).padStart(3, '0')}.png`))));
      await page.evaluate(images => [...document.images].forEach((img, i) => img.src = `data:image/png;base64,${images[i]}`), frames.map(f => f.toString('base64')));
      await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
      await page.screenshot({ path: join(proof, 'sequence.png') });
      await writeFile(join(proof, 'timing.json'), JSON.stringify({ ...motion, strokes }, null, 2));
      console.log(`Handwriting proof: ${proof}/sequence.png`);
    }
  } finally {
    await browser.close();
    await rm(temp, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
