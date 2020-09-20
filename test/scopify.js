var run = require('../run')
var expressions = require('./data/expressions')
var {print, eval:ev} = require('../util')
var parse = require('../dist/parse')()
var scopify = run('../scopify', __dirname)
var compile = run('../compile-js', __dirname)
var assert = require('assert')
var types = require('../types')
var HT = require('../hashtable')
var scope = require('../env')
function nop () { return null }

function test (src) {
  console.log("---------------")
  console.log("input:", src)
  var ast = parse(src)
  //print(ast)
  var _ast = scopify(ast)
  //print(_ast)
  console.log(compile(_ast, ()=>null))
  //ev(ast env)
  var _v = ev(_ast, HT(new Map(Object.entries(scope))))
  var v = ev(ast, HT(new Map(Object.entries(scope))))
  if(v.type === types.number) {
    assert.deepEqual(_v, v)
    console.log("test passed:", _v)
  }
  else
    console.log("skipping test")
}

;[
  'a:1 fn:{x; add(x a)}',
  'a:1 {; b:2 fn: {x; add(add(x a) b)} }()'
].forEach(test)

expressions.inputs.forEach(test)