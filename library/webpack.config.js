const path = require('path')

module.exports = [
  {
    target: "web",
    entry: {
      app: ["./src/entry.umd.js"]
    },
    output: {
      path: path.resolve(__dirname, "./build"),
      filename: "tm-utils.umd.js"
    },
    resolve: {
      alias: {
        'quasar': path.join(__dirname, './umd-alias/quasar.js'),
        'vue': path.join(__dirname, './umd-alias/vue.js')
      }
    }
  }
]