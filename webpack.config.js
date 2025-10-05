const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    devtool: 'cheap-module-source-map',

    entry: {
        content: path.resolve(__dirname, './src/content/content.ts'),
        background: path.resolve(__dirname, './src/background/background.ts'),
        popup: path.resolve(__dirname, './src/popup/popup.ts')
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js', // background.js, content.js, popup.js
        clean: true
    },

    resolve: {
        extensions: ['.ts', '.js']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: '.' },
                { from: 'src/icons', to: 'icons', noErrorOnMissing: true },
            ]
        }),

        new HtmlWebpackPlugin({
            template: 'src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
            inject: 'body'
        })
    ],

    optimization: {
        splitChunks: false
    }
};
