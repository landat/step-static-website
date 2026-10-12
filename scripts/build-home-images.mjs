import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

// Presentation assets only. Keep CMS originals and their public URLs intact.
const output = "assets/optimized";
await mkdir(output, { recursive: true });
const images = [
  ["assets/meteor-logo-header.jpg", "header", 992, 85],
  ["assets/picbl.jpg", "hero", 1024, 82],
  ["assets/picbl2.jpg", "hand-wraps", 1024, 82],
  // Actual first frame of meteor-overview.mp4, extracted without seeking.
  ["assets/videos/meteor-overview-first-frame.png", "video-poster", 640, 78],
  ...[480, 960, 1350].map((width) => ["assets/photos/IMG_20260805_212659.jpg", `training-${width}`, width, 82]),
];
for (const [source, name, width, quality] of images) {
  const target = `${output}/${name}.webp`;
  await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(target);
  console.log(`${target}: ${(await stat(target)).size} bytes`);
}
