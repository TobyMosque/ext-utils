/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 * API: https://github.com/quasarframework/quasar/blob/master/app/lib/app-extension/IndexAPI.js
 */
module.exports = function (api) {
  api.extendWebpack((cfg, { isClient, isServer }, api) => {
    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      '@toby.mosque/utils': '@toby.mosque/quasar-app-extension-utils/src/utils',
    }
  })
  api.extendQuasarConf((conf) => {
    conf.build.transpileDependencies.push(/@toby.mosque[\\/]quasar-app-extension-utils[\\/]src/)
  })
}

