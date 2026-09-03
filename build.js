import {
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

const root = import.meta.dirname;
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(src, dist, {
  recursive: true,
  filter: (source) => path.basename(source) !== 'manifest.json',
});

const manifest = JSON.parse(
  await readFile(
    path.join(src, 'manifest.json'),
    'utf8'
  )
);

for (const size of Object.keys(manifest.icons)) {
  manifest.icons[size] =
    manifest.icons[size].replace(/^src\//, '');
}

manifest.background.service_worker =
  manifest.background.service_worker.replace(/^src\//, '');

await writeFile(
  path.join(dist, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);
