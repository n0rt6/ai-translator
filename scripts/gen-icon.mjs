// 零依赖生成 512×512 图标:圆角渐变底 + 白色双向箭头(互译),4x 超采样抗锯齿
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 512;
const RADIUS = 116;

// 渐变:顶部靛蓝 → 底部紫
const TOP = [99, 102, 241];
const BOTTOM = [139, 92, 246];

const lerp = (a, b, t) => a + (b - a) * t;

// 圆角矩形(整个图标底)内的判定
function roundedRectMask(px, py) {
  if (px < 0 || py < 0 || px >= SIZE || py >= SIZE) return false;
  const nx = Math.max(RADIUS, Math.min(px, SIZE - RADIUS));
  const ny = Math.max(RADIUS, Math.min(py, SIZE - RADIUS));
  return Math.hypot(px - nx, py - ny) <= RADIUS;
}

// 白色双向箭头 ⇄ 的覆盖判定
function arrowMask(px, py) {
  // 中间水平条
  if (py >= 234 && py <= 278 && px >= 150 && px <= 362) return true;
  // 左箭头(指向左):三角形,顶点 (100,256),底边 x=150,y∈[206,306]
  if (px >= 100 && px <= 150 && py >= 206 && py <= 306) {
    const slope = 50 / 50; // 高度差 50 / 宽度 50
    const centerY = 256;
    const halfSpan = (px - 100) * slope;
    return Math.abs(py - centerY) <= halfSpan;
  }
  // 右箭头(指向右):顶点 (412,256),底边 x=362
  if (px >= 362 && px <= 412 && py >= 206 && py <= 306) {
    const centerY = 256;
    const halfSpan = 412 - px;
    return Math.abs(py - centerY) <= halfSpan;
  }
  // 上下短装饰条,让构图更饱满
  if (px >= 216 && px <= 296 && py >= 150 && py <= 168) return true;
  if (px >= 216 && px <= 296 && py >= 344 && py <= 362) return true;
  return false;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (SIZE * 4 + 1);
  raw[rowStart] = 0; // filter: None
  for (let x = 0; x < SIZE; x++) {
    // 2×2 超采样
    let bgHits = 0;
    let arrowHits = 0;
    for (const [ox, oy] of [
      [0.25, 0.25],
      [0.75, 0.25],
      [0.25, 0.75],
      [0.75, 0.75],
    ]) {
      const sx = x + ox;
      const sy = y + oy;
      if (roundedRectMask(sx, sy)) {
        bgHits++;
        if (arrowMask(sx, sy)) arrowHits++;
      }
    }
    if (bgHits === 0) {
      raw.fill(0, rowStart + 1 + x * 4, rowStart + 5 + x * 4); // 透明
      continue;
    }
    const t = y / (SIZE - 1);
    let r = lerp(TOP[0], BOTTOM[0], t);
    let g = lerp(TOP[1], BOTTOM[1], t);
    let b = lerp(TOP[2], BOTTOM[2], t);
    const arrowAlpha = arrowHits / 4;
    if (arrowAlpha > 0) {
      r = lerp(r, 255, arrowAlpha);
      g = lerp(g, 255, arrowAlpha);
      b = lerp(b, 255, arrowAlpha);
    }
    const i = rowStart + 1 + x * 4;
    raw[i] = Math.round(r);
    raw[i + 1] = Math.round(g);
    raw[i + 2] = Math.round(b);
    raw[i + 3] = 255;
  }
}

// PNG 编码
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "icon.png");
writeFileSync(outPath, png);
console.log(`icon written: ${outPath} (${png.length} bytes)`);
