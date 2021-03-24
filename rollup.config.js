import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const plugins = [
  typescript({
    useTsconfigDeclarationDir: true,
    tsconfigOverride: { exclude: ['**/__tests__/**', '**/setupTests.*'] },
  }),
  terser(),
];

const config = {
  plugins,
  input: pkg['main:src'],
  output: [
    { file: pkg.main, format: 'umd', sourcemap: true, name: 'cancelablePromise' },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
};

export default config;
