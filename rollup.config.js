import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
  input: 'index.js',
  output: {
    file: 'hms-bundle.bundle.js',
    format: 'iife', // attaches to window
    name: 'HMSBundle'
  },
  plugins: [
    resolve(),
    commonjs(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
};
