'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
    throw err;
});

const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const configFactory = require('../webpack.config');

try {
    const config = configFactory('development');
    // Create compiler
    const compiler = webpack(config);
    // Serve webpack assets generated by the compiler over a web server.
    const devServer = new WebpackDevServer(compiler, {
        // Enable gzip compression of generated files.
        compress: true,
        // Silence WebpackDevServer's own logs since they're generally not useful.
        // It will still show compile warnings and errors with this setting.
        clientLogLevel: 'none',
        // Specifies the path from which to serve static files
        contentBase: path.resolve(process.cwd(), 'public'),
        // By default files from `contentBase` will not trigger a page reload.
        watchContentBase: true,
        // Enable hot reloading server. The WebpackDevServer client is included
        // as an entry point in the webpack development configuration.
        // Note that only changes to CSS are currently hot reloaded.
        // JS changes will refresh the browser.
        hot: true,
    });
    // Launch WebpackDevServer.
    devServer.listen(3000, err => {
        if (err) {
            return console.log(err);
        }

        console.log('Starting the development server...\n');
    });

    ['SIGINT', 'SIGTERM'].forEach(sig => {
        process.on(sig, () => {
            devServer.close();
            process.exit();
        });
    });
} catch (err) {
    if (err && err.message) {
        console.log(err.message);
    }
    process.exit(1);
}