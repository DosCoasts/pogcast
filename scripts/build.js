'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'production';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
    throw err;
});

const fs = require('fs-extra');
const webpack = require('webpack');
const configFactory = require('../webpack.config');

// Generate configuration
const config = configFactory('production');

// Empty the build directory
fs.emptyDirSync('build');
// Copy the public folder to build (ignoring index.html)
fs.copySync('public', 'build', { dereference: true });

// Start the webpack build
const compiler = webpack(config);
compiler.run(err => process.exit(err ? 1 : 0));
