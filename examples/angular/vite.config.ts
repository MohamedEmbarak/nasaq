import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Small standalone JIT demo. The library itself is compiled to APF by ng-packagr.
// An Angular CLI application can consume the same APF package with AOT/linking.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  server: { port: 4175 },
  build: { outDir: 'dist', emptyOutDir: true },
  resolve: { dedupe: ['@angular/core', '@angular/common', '@angular/forms', '@angular/compiler', 'rxjs'] },
  esbuild: { tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } } },
});
