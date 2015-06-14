module.exports = {
    entry: "./src/entry.js",
    output: {
        path: "./",
        filename: "bundle.js"
    },
    devtool: "source-map",
    module: {
        loaders: [
            { test: /\.jsx?$/, loaders: ['babel-loader?stage=1'], exclude: /node_modules/ }
          , { test: /\.css$/, loader: "style-loader!css-loader!postcss-loader" }
        ]
    }
  , postcss: [ require('autoprefixer-core') ]
}
