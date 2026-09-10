import { readdir, rename, stat, unlink } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import sharp from "sharp";

const photosDirectory = resolve("assets/photos");
const maximumSide = 2400;
const maximumBytes = 1_500_000;
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const names = await readdir(photosDirectory);

for (const name of names) {
  const extension = extname(name).toLowerCase();
  if (!supportedExtensions.has(extension)) continue;

  const filePath = join(photosDirectory, name);
  const fileStat = await stat(filePath);
  const metadata = await sharp(filePath).metadata();
  const tooLarge = fileStat.size > maximumBytes || (metadata.width || 0) > maximumSide || (metadata.height || 0) > maximumSide;
  if (!tooLarge) continue;

  const temporaryPath = `${filePath}.optimized${extension}`;
  let pipeline = sharp(filePath)
    .rotate()
    .resize({ width: maximumSide, height: maximumSide, fit: "inside", withoutEnlargement: true });

  if (extension === ".jpg" || extension === ".jpeg") pipeline = pipeline.jpeg({ quality: 84, mozjpeg: true });
  if (extension === ".png") pipeline = pipeline.png({ compressionLevel: 9, palette: true });
  if (extension === ".webp") pipeline = pipeline.webp({ quality: 84 });

  await pipeline.toFile(temporaryPath);
  const optimizedStat = await stat(temporaryPath);
  if (optimizedStat.size < fileStat.size) {
    await unlink(filePath);
    await rename(temporaryPath, filePath);
    console.log(`Оптимизировано: ${name} (${fileStat.size} → ${optimizedStat.size} байт)`);
  } else {
    await unlink(temporaryPath);
  }
}
