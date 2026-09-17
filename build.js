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
const srcCss = path.join(src, 'css');
const distCss = path.join(dist, 'css');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(src, dist, {
  recursive: true,
});

const styles = await readFile(
  path.join(srcCss, 'styles.css'),
  'utf8'
);

const imports = [
  ...styles.matchAll(
    /@import\s+url\(["']\.\/([^"']+)["']\);/g
  ),
];

let bundledStyles = styles;

for (const match of imports) {
  const file = match[1];
  const content = await readFile(
    path.join(srcCss, file),
    'utf8'
  );

  bundledStyles = bundledStyles.replace(match[0], content);
}

await writeFile(
  path.join(distCss, 'styles.css'),
  bundledStyles
);

for (const match of imports) {
  await rm(path.join(distCss, match[1]));
}
