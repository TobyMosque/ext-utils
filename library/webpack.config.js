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

const dev = process.env.NODE_ENV === 'development'
const nodeConfig = {
  target: "node",
  mode: dev ? 'development' : 'production',
  devtool: dev ? '#cheap-module-eval-source-map' : '#source-map',
  entry: {
    app: ["./src/index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: '[name]${fileHash}.js',
    chunkFilename: '[name]${chunkHash}.js',
    libraryTarget: 'commonjs2'
  },
  externals: [nodeExternals()]
}

module.exports = [ webConfig, nodeConfig ]