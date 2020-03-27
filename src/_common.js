const getCases = function (text) {
  let cases = {}
  if (text.includes('-')) {
    cases.lower = text.toLowerCase()
    cases.camel = cases.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    cases.pascal = cases.camel[0].toUpperCase() + cases.camel.substr(1)
  } else {
    cases.camel = text[0].toLowerCase() + text.substr(1)
    cases.pascal = text[0].toUpperCase() + text.substr(1)
  }
  return cases
}

export {
  getCases
}
