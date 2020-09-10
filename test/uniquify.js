var run = require('../run')
var parse = require('../handwritten/parse')()
var inspect = require('util').inspect
var ast = parse('x: 1 y:{x; mul(x x) }')
var ev      = require('../util').eval
//var HT = require('../hashtable')
var assert = require('assert')

var fn = run('../uniquify.al', __dirname)

var {inputs,outputs,output_values} = require('./data/expressions')
for(var i = 0; i < inputs.length; i++) {
  var ast = parse(inputs[i])
  ast = fn(i*10)(ast)
  console.log(inspect(ast, {colors: true , depth: 100}))
  var v = ev(ast)
  console.log(v)
  assert.deepEqual(v, outputs[i])
}