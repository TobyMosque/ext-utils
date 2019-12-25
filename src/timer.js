/**
 * creates a Promise who does nothing and will be resolved in x milliseconds
 * @param {Number} delay - time in milliseconds to suspend the current process.
 * @returns {Promise}
 */
const sleep = function (delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

module.exports = {
  sleep
}