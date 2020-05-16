/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */
module.exports = function (api) {
  api.extendQuasarConf((conf) => {
    if (api.prompts.transpile) {
      conf.build.transpileDependencies.push(/@toby.mosque[\\/]quasar-app-extension-utils[\\/]src/)
      conf.build.transpileDependencies.push(/@toby.mosque[\\/]utils[\\/]src/)
    }
  })
}

