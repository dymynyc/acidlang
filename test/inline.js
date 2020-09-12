var run = require('../run')
var {print, eval:ev} = require('../util')
var parse = require('../handwritten/parse')()
var uniquify = run('../uniquify', __dirname)
var inline = run('../inline', __dirname)
var compile = run('../compile-js', __dirname)
var assert = require('assert')

function nop () { return null }

function test (src) {
  console.log("---------------")
  console.log("input:", src)
  var ast = parse(src)
  var result = ev(ast)

  print(ast = uniquify(0)(ast))
  assert.deepEqual(ev(ast), result, 'uniquify should not change meaning')
  print(ast)
  ast = inline(ast)
  print(ast)
  //assert.deepEqual(ev(ast), result, 'inline should not change meaning')
  console.log(compile(ast, nop))
}

;[
  'suc:{val; add(val 1)} suc(7)',
  'create:{val; {diff; add(val diff)}} counter: create(3) counter(7)',
  'foo:{f; f(7)} foo({x; mul(x x)})',
//  'foo:{f; f(7)} y:foo({x; mul(x x)}) y=foo({z; mul(z mul(z z))}) y',
  'foo:{x; y:mul(x 2) {z; mul(y z)}} foo(3)(5)'
].forEach(test)