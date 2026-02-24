import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'schemas/index': 'src/schemas/index.ts',
    'constants/index': 'src/constants/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
