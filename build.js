import {
  build,
} from 'esbuild';

import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

const root = import.meta.dirname;
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

async function copyAssets(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '_locales')
        continue;

      await mkdir(destinationPath, { recursive: true });
      await copyAssets(sourcePath, destinationPath);
      continue;
    }

    if (
      entry.name !== 'manifest.json' &&
      !entry.name.endsWith('.js') &&
      !entry.name.endsWith('.css')
    ) {
      await cp(sourcePath, destinationPath);
    }
  }
}

await copyAssets(src, dist);

async function getFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await getFiles(filePath, extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(filePath);
    }
  }

  return files;
}

const jsFiles = [
  ...await getFiles(path.join(src, 'js'), '.js'),
  ...await getFiles(path.join(src, 'components'), '.js'),
];

const cssFiles = [
  ...await getFiles(path.join(src, 'css'), '.css'),
  ...await getFiles(path.join(src, 'components'), '.css'),
];

await build({
  entryPoints: jsFiles,
  outdir: dist,
  outbase: src,
  bundle: false,
  minify: false,
  sourcemap: true,
});

await build({
  entryPoints: cssFiles,
  outdir: dist,
  outbase: src,
  minify: false,
  sourcemap: true,
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

await cp(
  path.join(src, '_locales'),
  path.join(dist, '_locales'),
  { recursive: true }
);
