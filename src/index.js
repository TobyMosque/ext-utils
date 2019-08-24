/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */
const factory = require('./factory')
const store = require('./store')
const uuid = require('./uuid')

module.exports = {
  default: function (api) {
    //
  },
  factory,
  store,
  uuid
}

