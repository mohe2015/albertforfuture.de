import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'themes/albertforfuture.de/assets/index.js',
    output: {
      file: 'themes/albertforfuture.de/assets/bundle.js',
      format: 'esm'
    },
    plugins: [
      resolve()
    ]
  };