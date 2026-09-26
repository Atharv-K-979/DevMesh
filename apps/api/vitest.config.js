import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'ecmascript',
          decorators: true,
          decoratorsBeforeExport: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
        keepClassNames: true,
      },
    }),
  ],
});
