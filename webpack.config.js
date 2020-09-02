'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const ManifestPlugin = require('webpack-manifest-plugin');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const postcssNormalize = require('postcss-normalize');

const src = path.resolve('src');

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = (webpackEnv) => {
    const isEnvDevelopment = webpackEnv === 'development';
    const isEnvProduction = webpackEnv === 'production';

    return {
        mode: webpackEnv,
        // Stop compilation early in production
        bail: isEnvProduction,
        devtool: isEnvProduction
            ? 'source-map'
            : isEnvDevelopment && 'cheap-module-source-map',
        // These are the "entry points" to our application.
        // This means they will be the "root" imports that are included in JS bundle.
        entry: [
            // A client's job is to connect to WebpackDevServer by a socket and get notified about changes.
            // When you save a file, the client will either apply hot updates, or refresh the page.
            ...(isEnvDevelopment ? [
                require.resolve('webpack-dev-server/client') + '?/',
                require.resolve('webpack/hot/dev-server')
            ] : []),
            // Finally, this is your app's code:
            './src/index.js',
            // We include the app code last so that if there is a runtime error during
            // initialization, it doesn't blow up the WebpackDevServer client, and
            // changing JS code would still trigger a refresh.
        ],
        output: {
            // The build folder.
            path: isEnvProduction ? 'build' : undefined,
            // Add /* filename */ comments to generated require()s in the output.
            pathinfo: isEnvDevelopment,
            // There will be one main bundle, and one file per asynchronous chunk.
            // In development, it does not produce real files.
            filename: isEnvProduction
                ? 'static/js/[name].[contenthash:8].js'
                : isEnvDevelopment && 'static/js/bundle.js',
            // TODO: remove this when upgrading to webpack 5
            futureEmitAssets: true,
            // There are also additional JS chunk files if you use code splitting.
            chunkFilename: isEnvProduction
                ? 'static/js/[name].[contenthash:8].chunk.js'
                : isEnvDevelopment && 'static/js/[name].chunk.js',
            // webpack uses `publicPath` to determine where the app is being served from.
            // It requires a trailing slash, or the file assets will get an incorrect path.
            // We inferred the "public path" (such as / or /my-project) from homepage.
            publicPath: '/',
            // this defaults to 'window', but by setting it to 'this' then
            // module chunks which are built will work in web workers as well.
            globalObject: 'this',
        },
        resolve: {
            // Extensions that will be used when an import is declared with no extension.
            extensions: ['.mjs', '.js', '.json', '.wasm'],
        },
        // Some libraries import Node modules but don't use them in the browser.
        // Tell webpack to provide empty mocks for them so importing them works.
        node: {
            module: 'empty',
            dgram: 'empty',
            dns: 'mock',
            fs: 'empty',
            http2: 'empty',
            net: 'empty',
            tls: 'empty',
            child_process: 'empty',
        },
        module: {
            strictExportPresence: true,
            rules: [
                // Disable require.ensure as it's not a standard language feature.
                { parser: { requireEnsure: false } },

                // First, run the linter.
                // It's important to do this before Babel processes the JS.
                {
                    test: /\.(js|mjs|jsx|ts|tsx)$/,
                    enforce: 'pre',
                    use: [{
                        options: { cache: true, },
                        loader: require.resolve('eslint-loader'),
                    }],
                    include: src,
                },
                {
                    // "oneOf" will traverse all following loaders until one will
                    // match the requirements. When no loader matches it will fall
                    // back to the "file" loader at the end of the loader list.
                    oneOf: [
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: 10000,
                                name: 'static/media/[name].[hash:8].[ext]',
                            },
                        },
                        // Process application JS with Babel.
                        // The preset includes JSX, Flow, and some ESnext features.
                        {
                            test: /\.(js|mjs|jsx)$/,
                            include: src,
                            loader: require.resolve('babel-loader'),
                            options: {
                                presets: [
                                    [
                                        // Latest stable ECMAScript features
                                        require('@babel/preset-env').default,
                                        {
                                            // Allow importing core-js in entrypoint and use browserlist to select polyfills
                                            useBuiltIns: 'entry',
                                            // Set the corejs version we are using to avoid warnings in console
                                            corejs: 3,
                                            // Exclude transforms that make all code slower
                                            exclude: ['transform-typeof-symbol'],
                                        },
                                    ],
                                    [
                                        require('@babel/preset-react').default,
                                        {
                                            // Adds component stack to warning messages
                                            // Adds __self attribute to JSX which React will use for some warnings
                                            development: isEnvDevelopment,
                                            // Will use the native built-in instead of trying to polyfill
                                            // behavior for any plugins that require one.
                                            useBuiltIns: true,
                                        },
                                      ]
                                ],
                                plugins: [
                                    // class { handleClick = () => { } }
                                    // Enable loose mode to use assignment instead of defineProperty
                                    // See discussion in https://github.com/facebook/create-react-app/issues/4263
                                    [
                                        require('@babel/plugin-proposal-class-properties').default,
                                        {
                                            loose: true,
                                        },
                                    ],
                                    // Adds Numeric Separators
                                    require('@babel/plugin-proposal-numeric-separator').default,
                                    // Polyfills the runtime needed for async/await, generators, and friends
                                    // https://babeljs.io/docs/en/babel-plugin-transform-runtime
                                    [
                                        require('@babel/plugin-transform-runtime').default,
                                        {
                                            corejs: false,
                                            helpers: true,
                                            regenerator: true,
                                            useESModules: true,
                                        },
                                    ],
                                    // Optional chaining and nullish coalescing are supported in @babel/preset-env,
                                    // but not yet supported in webpack due to support missing from acorn.
                                    // These can be removed once webpack has support.
                                    // See https://github.com/facebook/create-react-app/issues/8445#issuecomment-588512250
                                    require('@babel/plugin-proposal-optional-chaining').default,
                                    require('@babel/plugin-proposal-nullish-coalescing-operator').default,
                                ],
                                // This is a feature of `babel-loader` for webpack (not Babel itself).
                                // It enables caching results in ./node_modules/.cache/babel-loader/
                                // directory for faster rebuilds.
                                cacheDirectory: true,
                                // See #6846 for context on why cacheCompression is disabled
                                cacheCompression: false,
                                compact: isEnvProduction,
                            },
                        },
                        // Process any JS outside of the app with Babel.
                        // Unlike the application JS, we only compile the standard ES features.
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            loader: require.resolve('babel-loader'),
                            options: {
                                babelrc: false,
                                configFile: false,
                                compact: false,
                                // Babel assumes ES Modules, which isn't safe until CommonJS
                                // dies. This changes the behavior to assume CommonJS unless
                                // an `import` or `export` is present in the file.
                                // https://github.com/webpack/webpack/issues/4039#issuecomment-419284940
                                sourceType: 'unambiguous',
                                presets: [
                                    [
                                        // Latest stable ECMAScript features
                                        require('@babel/preset-env').default,
                                        {
                                            // Allow importing core-js in entrypoint and use browserlist to select polyfills
                                            useBuiltIns: 'entry',
                                            // Set the corejs version we are using to avoid warnings in console
                                            // This will need to change once we upgrade to corejs@3
                                            corejs: 3,
                                            // Exclude transforms that make all code slower
                                            exclude: ['transform-typeof-symbol'],
                                        },
                                    ],
                                ],
                                plugins: [
                                    // Polyfills the runtime needed for async/await, generators, and friends
                                    // https://babeljs.io/docs/en/babel-plugin-transform-runtime
                                    [
                                        require('@babel/plugin-transform-runtime').default,
                                        {
                                            corejs: false,
                                            helpers: true,
                                            regenerator: true,
                                            useESModules: true,
                                        },
                                    ],
                                ],
                                cacheDirectory: true,
                                // See #6846 for context on why cacheCompression is disabled
                                cacheCompression: false,
                                
                                // Babel sourcemaps are needed for debugging into node_modules
                                // code.  Without the options below, debuggers like VSCode
                                // show incorrect code and set breakpoints on the wrong lines.
                                sourceMaps: true,
                                inputSourceMap: true,
                            },
                        },
                        // "postcss" loader applies autoprefixer to our CSS.
                        // "css" loader resolves paths in CSS and adds assets as dependencies.
                        // "style" loader turns CSS into JS modules that inject <style> tags.
                        // In production, we use MiniCSSExtractPlugin to extract that CSS
                        // to a file, but in development "style" loader enables hot editing
                        // of CSS.
                        // By default we support CSS Modules with the extension .module.css
                        {
                            test: /\.css$/,
                            use: [
                                isEnvDevelopment && require.resolve('style-loader'),
                                isEnvProduction && {
                                    loader: MiniCssExtractPlugin.loader,
                                },
                                {
                                    loader: require.resolve('css-loader'),
                                    options: {
                                        importLoaders: 1,
                                        sourceMap: isEnvProduction,
                                    },
                                },
                                {
                                    // Options for PostCSS as we reference these options twice
                                    // Adds vendor prefixing based on your specified browser support in
                                    // package.json
                                    loader: require.resolve('postcss-loader'),
                                    options: {
                                        // Necessary for external CSS imports to work
                                        // https://github.com/facebook/create-react-app/issues/2677
                                        ident: 'postcss',
                                        plugins: () => [
                                            require('postcss-flexbugs-fixes'),
                                            require('postcss-preset-env')({
                                                autoprefixer: {
                                                    flexbox: 'no-2009',
                                                },
                                                stage: 3,
                                            }),
                                            // Adds PostCSS Normalize as the reset css with default options,
                                            // so that it honors browserslist config in package.json
                                            // which in turn let's users customize the target behavior as per their needs.
                                            postcssNormalize(),
                                        ],
                                        sourceMap: isEnvProduction,
                                    },
                                },
                            ].filter(Boolean),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true,
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            loader: require.resolve('file-loader'),
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html`, `json`, and `wasm` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /\.wasm$/],
                            options: {
                                name: 'static/media/[name].[hash:8].[ext]',
                            },
                        },
                        // ** STOP ** Are you adding a new loader?
                        // Make sure to add the new loader(s) before the "file" loader.
                    ],
                },
            ],
        },
        plugins: [
            // Generates an `index.html` file with the <script> injected.
            new HtmlWebpackPlugin({
                inject: true,
                template: path.resolve('src/index.html'),
                ...(isEnvProduction ? {
                    minify: {
                        removeComments: true,
                        collapseWhitespace: true,
                        removeRedundantAttributes: true,
                        useShortDoctype: true,
                        removeEmptyAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        keepClosingSlash: true,
                        minifyJS: true,
                        minifyCSS: true,
                        minifyURLs: true,
                    },
                } : undefined)
            }),
            // Makes some environment variables available to the JS code, for example:
            // if (process.env.NODE_ENV === 'production') { ... }.
            // It is absolutely essential that NODE_ENV is set to production
            // during a production build.
            // Otherwise React will be compiled in the very slow development mode.
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
                }
            }),
            // This is necessary to emit hot updates (currently CSS only):
            isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
            // Watcher doesn't work well if you mistype casing in a path so we use
            // a plugin that prints an error when you attempt to do this.
            // See https://github.com/facebook/create-react-app/issues/240
            isEnvDevelopment && new CaseSensitivePathsPlugin(),
            isEnvProduction &&
                new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: 'static/css/[name].[contenthash:8].css',
                    chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
                }),
            // Generate an asset manifest file with the following content:
            // - "files" key: Mapping of all asset filenames to their corresponding
            //   output file so that tools can pick it up without having to parse
            //   `index.html`
            // - "entrypoints" key: Array of files which are included in `index.html`,
            //   can be used to reconstruct the HTML if necessary
            new ManifestPlugin({
                fileName: 'asset-manifest.json',
                publicPath: '/',
                generate: (seed, files, entrypoints) => {
                    const manifestFiles = files.reduce((manifest, file) => {
                        manifest[file.name] = file.path;
                        return manifest;
                    }, seed);
                    const entrypointFiles = entrypoints.main.filter(
                        fileName => !fileName.endsWith('.map')
                    );

                    return {
                        files: manifestFiles,
                        entrypoints: entrypointFiles,
                    };
                },
            }),
            new WasmPackPlugin({
                crateDirectory: path.resolve(__dirname, 'src/native-pogcast'),
                extraArgs: '--no-typescript',
                outDir: path.resolve(__dirname, 'src/native-pogcast/pkg')
            })
        ].filter(Boolean),
        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                // This is only used in production mode
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            // We want terser to parse ecma 8 code. However, we don't want it
                            // to apply any minification steps that turns valid ecma 5 code
                            // into invalid ecma 5 code. This is why the 'compress' and 'output'
                            // sections only apply transformations that are ecma 5 safe
                            // https://github.com/facebook/create-react-app/pull/4234
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                            // Disabled because of an issue with Terser breaking valid code:
                            // https://github.com/facebook/create-react-app/issues/5250
                            // Pending further investigation:
                            // https://github.com/terser-js/terser/issues/120
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        output: {
                            ecma: 5,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true,
                        },
                    },
                    sourceMap: true,
                }),
                // This is only used in production mode
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        parser: safePostCssParser,
                        map: {
                            // forces the sourcemap to be output into a separate file
                            inline: false,
                            // appends the sourceMappingURL to the end of the css file,
                            // helping the browser find the sourcemap
                            annotation: true,
                        },
                    },
                    cssProcessorPluginOptions: {
                        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
                    },
                }),
            ],
            // Automatically split vendor and commons
            // https://twitter.com/wSokra/status/969633336732905474
            // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
            splitChunks: {
                chunks: 'all',
                name: false,
            },
            // Keep the runtime chunk separated to enable long term caching
            // https://twitter.com/wSokra/status/969679223278505985
            // https://github.com/facebook/create-react-app/issues/5358
            runtimeChunk: {
                name: entrypoint => `runtime-${entrypoint.name}`,
            },
        },
    };
};
