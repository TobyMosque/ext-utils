const sleep = function (delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

module.exports = {
  sleep
}