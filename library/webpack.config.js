const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = [
  {
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
  },
  {
    target: "node",
    entry: {
      app: ["./src/index.js"]
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "index.common.js",
      libraryTarget: 'commonjs2'
    },
    externals: [nodeExternals()]
  }
]