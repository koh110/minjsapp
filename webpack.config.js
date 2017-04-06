'use strict';

const path = require('path');
const webpack = require('webpack');

const JS_PATH = path.resolve(process.env.SRC_PATH, 'js');
const DIST_PATH = path.resolve(process.env.DIST_PATH);

module.exports = {
  entry: {
    app: `${JS_PATH}/app.js`,
    vendor: `${JS_PATH}/vendor.js`
  },
  devtool: 'source-map',
  output: {
    path: DIST_PATH
  },
  externals: {
    document: 'document'
  },
  resolve: {
    modules: [
      'node_modules',
      JS_PATH
    ],
    extensions: ['.js']
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ['es2015']
        }
      }]
    }]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor']
    })
  ]
};
