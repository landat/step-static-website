import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = await readFile("assets/favicon.svg");
const icons = await Promise.all([16, 32].map((size) => sharp(svg).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + icons.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
for (const [index, data] of icons.entries()) {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = index === 0 ? 16 : 32;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(data.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += data.length;
}
await writeFile("favicon.ico", Buffer.concat([header, ...icons]));
await writeFile("assets/favicon-32.png", icons[1]);
await sharp(svg).resize(180, 180).png().toFile("assets/apple-touch-icon.png");
console.log("Фавикон: SVG, ICO 16/32, PNG 32 и иконка Apple 180.");
