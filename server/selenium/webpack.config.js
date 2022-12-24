
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: path.resolve(__dirname) + '/ui/js/src/entry.js',
    output: {
        path: path.resolve(__dirname) + '/ui/js/dist',
        filename: 'bundle.js',
        publicPath: '/app/'
    },
    watch: true,
    watchOptions: {
      aggregateTimeout: 200,
      poll: 1000,
      ignored: '**/node_modules',
    },
    //externals: ['fs'],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
        {
          test: /\.(svg|gif|png|eot|woff|ttf)$/,
          use: [
            'url-loader',
          ],
        },
        {
          test: /\.ya?ml$/,
          use: 'js-yaml-loader',
        },
        {
          test: /\.(jpe?g|png|gif)$/i,
          loader: "file-loader",
          options:{
            name: '[name].[ext]',
            outputPath: 'assets/images/'
            //the images will be emited to dist/assets/images/ folder
          }
      }
      ]
    },
    plugins: [
      /* Use the ProvidePlugin constructor to inject jquery implicit globals */
      new webpack.ProvidePlugin({
          $               : "jquery",
          jQuery          : "jquery",
          "window.jQuery" : "jquery",
          "window.$"      : "jquery"
      })
    ]
}
