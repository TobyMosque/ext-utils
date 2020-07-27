const path = require('path')
const nodeExternals = require('webpack-node-externals')

const webConfig = {
  target: "web",
  entry: {
    app: ["./src/entry.umd.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.umd.js"
  },
  resolve: {
    alias: {
      'quasar': path.join(__dirname, './umd-alias/quasar.js'),
      'vue': path.join(__dirname, './umd-alias/vue.js')
    }
  }
}

// production => #source-map
// development => #cheap-module-eval-source-map
const nodeConfig = {
  target: "node",
  mode: 'production',
  devtool: '#source-map',
  entry: {
    app: ["./src/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: '[name].js',
    chunkFilename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()]
}

module.exports = [ webConfig, nodeConfig ]