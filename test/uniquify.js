var run = require('../run')
var parse = require('../handwritten/parse')()
var inspect = require('util').inspect
var ast = parse('x: 1 y:{x; mul(x x) }')
var ev      = require('../eval')
var HT = require('../hashtable')
var assert = require('assert')

var wrap = require('../util').wrap
var _scope = require('../env')
var scope = {}
for(var k in _scope) scope[k] = wrap(_scope[k])

var fn = run('../inline.al', __dirname)

var {inputs,outputs,output_values} = require('./data/expressions')
for(var i = 0; i < inputs.length; i++) {
  var ast = parse(inputs[i])
  ast = fn(ast)
  console.log(inspect(ast, {colors: true , depth: 100}))
  var v = ev(ast, HT(new Map(Object.entries(scope))))
  console.log(v)
  assert.deepEqual(v, outputs[i])
}