module.exports = {
    entry: "./src/entry.jsx",
    output: {
        path: "./",
        filename: "bundle.js"
    },
    devtool: "source-map",
    module: {
        loaders: [
            { test: /\.jsx?$/, loaders: ['jsx-loader'], exclude: /node_modules/ }
          , { test: /\.(css||styl)$/, loader: "style-loader!css-loader!postcss-loader!stylus-loader" }
          , { test: /\.coffee$/, loader: "coffee-loader" }
          , { test: /\.(coffee\.md|litcoffee)$/, loader: "coffee-loader?literate" }
        ]
    }
  , resolve: {
        extensions: ['.css', '', '.jsx', '.js', '.coffee']
    }

  , postcss: [ require('autoprefixer-core') ]
}
