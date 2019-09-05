const uid = require('quasar').uid

const comb = function (date) {
  if (!date) {
    date = new Date()
  }
  let uuid = uid()
  let comb = ('00000000000' + date.getTime().toString(16)).substr(-12)
  comb = comb.slice(0, 8) + '-' + comb.slice(8, 12)
  return uuid.replace(uuid.slice(0, 13), comb)
}

const extract = function (comb) {
  let text = comb.replace(/-/g, '').substr(0, 12)
  let time = parseInt(text, 16)
  return new Date(time)
}

module.exports = {
  comb,
  extract
}