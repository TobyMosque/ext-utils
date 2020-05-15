import utils from './index'

if (!('TobyMosque' in window)) {
  Object.defineProperty(window, 'TobyMosque', {
    value: {},
    configurable: false,
    writable: false
  })
}

if (!('utils' in window.TobyMosque)) {
  Object.defineProperty(window.TobyMosque, 'utils', {
    value: utils,
    configurable: false,
    writable: false
  })
}