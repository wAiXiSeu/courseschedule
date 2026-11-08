import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: {
    index: resolve(root, 'src/index.ts'),
    http: resolve(root, 'src/http.ts'),
  },
  outdir: resolve(root, 'dist'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  // 与 web 端 vite alias 同一策略：shared 直引源码，不依赖其 dist 产物
  alias: { '@courseschedule/shared': resolve(root, '../shared/src/index.ts') },
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'info',
});