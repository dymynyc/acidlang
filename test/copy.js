var assert = require('assert')
var data = require('./data/expressions')
var parse = require('../dist/parse.js')()
var copy = require('../dist/copy').copy
var _inspect = require('util').inspect
function inspect (v) {
  return _inspect(v, {colors: false, depth: Infinity})
}
data.inputs.forEach(function (src) {
  var ast = parse(src)
  var _ast = copy(ast)
  assert.deepEqual(inspect(_ast), inspect(ast))
  assert.notStrictEqual(_ast, ast)
})

