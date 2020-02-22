import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'bootstrap/dist/js/bootstrap.esm.js',
    output: {
      file: 'bundle.js',
      format: 'esm'
    },
    plugins: [resolve()]
  };