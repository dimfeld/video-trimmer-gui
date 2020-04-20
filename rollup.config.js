import * as fs from 'fs';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import babel from 'rollup-plugin-babel';
import copy from 'rollup-plugin-copy';

const production = process.env.NODE_ENV !== 'development';

const babelConfig = {
  extensions: ['.js', '.mjs', '.html', '.svelte', '.ts'],
  exclude: ['node_modules/@babel/**', 'static/**', 'build/**', 'public/**'],
  presets: [
    ['@babel/preset-env', { targets: { chrome: 80 } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
  ],
};

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'build/bundle.js',
  },
  plugins: [
    svelte({
      preprocess: require('./svelte.config').preprocess,
      // enable run-time checks when not in production
      dev: !production,
      // extract any component CSS out into
      // a separate file — better for performance
      css: (css) => {
        css.write('build/app.css');
      },
    }),
    postcss({
      extract: 'util.css',
    }),

    resolve({
      mainFields: ['module', 'browser', 'main'],
      extensions: ['.mjs', '.js', '.json', '.ts', '.svelte'],
      dedupe: (importee) =>
        importee === 'svelte' || importee.startsWith('svelte/'),
    }),
    copy({
      targets: [{ src: 'static/**/*', dest: 'build/' }],
    }),
    commonjs(),
    babel(babelConfig),

    // Watch the `build` directory and refresh the
    // browser on changes when not in production
    !production && livereload('build'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
