import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'public/index.js',
    output: {
      file: 'public/bundle.js',
    },
    plugins: [
      resolve()
    ]
  };