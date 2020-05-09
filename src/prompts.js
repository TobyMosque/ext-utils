module.exports = function () {
  return [
    {
      type: 'confirm',
      name: 'transpile',
      message: "Add that extension to the transpile dependencies?",
      default: false
    }
  ]
}