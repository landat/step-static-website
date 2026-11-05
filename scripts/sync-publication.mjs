import { copyFile, readdir, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// Keep ready-to-serve pages in main as well as dist: the existing Rusonyx
// automatic update reads this repository, without requiring a new build on the host.
const generated = (await readdir("dist")).filter((file) => file.endsWith(".html"));
for (const file of generated) await copyFile(`dist/${file}`, file);
for (const file of await readdir(".")) {
  if (!/^article-[a-z0-9-]+\.html$/.test(file) || generated.includes(file)) continue;
  const target = resolve(file);
  if (dirname(target) !== process.cwd()) throw new Error("Generated page must be in workspace root");
  await unlink(target);
}
console.log(`Готовые страницы синхронизированы с корнем репозитория: ${generated.length}.`);
