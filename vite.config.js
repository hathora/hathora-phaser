import {resolve} from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // const env = loadEnv(mode, process.cwd(), '')
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'lib/index.ts'),
        fileName: 'HathoraPhaser',
        formats: ['cjs', 'es'],
      },
      minify: false
    },
    assetsInclude: ['**/*.css']
    // vite config
    // define: {
    //   __APP_ENV__: env.APP_ENV,
    // },
  }
})