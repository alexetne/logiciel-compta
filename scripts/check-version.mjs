import { readFile } from 'node:fs/promises';

const manifests = ['package.json', 'apps/api/package.json', 'apps/web/package.json'];
const packages = await Promise.all(manifests.map(async (path) => ({
  path,
  manifest: JSON.parse(await readFile(path, 'utf8')),
})));
const expected = packages[0].manifest.version;
const mismatches = packages.filter(({ manifest }) => manifest.version !== expected);

if (mismatches.length) {
  console.error(`Version attendue : ${expected}`);
  for (const { path, manifest } of mismatches) console.error(`${path} : ${manifest.version}`);
  process.exit(1);
}

console.log(`Versions alignées : ${expected}`);
