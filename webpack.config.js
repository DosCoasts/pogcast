const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = env => ({
    mode: env.production ? 'production' : 'development',
    bail: env.production,
    entry: './src/index.js',
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'build'),
    },
    devtool: !env.production && 'cheap-module-source-map',
    devServer: {
        contentBase: './public',
        watchContentBase: true,
        hot: true
    },
    module: {
        rules: [{
            test: /\.m?js$/,
            enforce: 'pre',
            use: {
                loader: 'eslint-loader',
                options: { cache: true },
            }
        }, {
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        // includes whatever babel plugins are required based on browserlist config
                        ['@babel/preset-env', {
                            // imports polyfills in the entry point of the app
                            useBuiltIns: 'entry'
                        }],
                        '@babel/preset-react',
                    ],
                    plugins: [
                        '@babel/plugin-transform-runtime',
                    ],
                    cacheDirectory: true,
                }
            }
        }, {
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader',
            ]
        }, {
            test: /\.(png|svg|jpg|gif)$/,
            use: [
                'file-loader',
            ],
        }],
    },
    plugins: [
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
        new HtmlWebpackPlugin({
            template: path.resolve('src/index.html'),
        }),
        new WasmPackPlugin({ 
            crateDirectory: path.resolve('src/native-pogcast'),
            extraArgs: '--no-typescript',
            outDir: path.resolve('src/native-pogcast/pkg')
        })
    ],
    optimization: {
        // The following 3 options are for caching optimization
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
    experiments: {
        syncWebAssembly: true
    }
});