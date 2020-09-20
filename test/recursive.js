var funs = require('../dist/functions')
var parse = require('../dist/parse')()
var assert = require('assert')
var inputs = [
  "R:{; R() }", //infinite loop
  "R:{i; lt(i 10) ? R(add(1 i)) ; true }", //loopable
  "fib:{n; eq(n 0) ? 1 ; eq(n 1) ? 1 ; add(fib(sub(n 2)) fib(sub(n 1))) }",
  //this one should be loopable
  "R:{f1 f2 i; lt(i n) ? R(add(f1 f2) f1 add(i 1)) ; add(f1 f2) }"
]
var loops = [
  false,
  true,
  false,
  true
]
inputs.forEach(function (v, i) {
  var ast = parse(v)
  assert.ok(funs.is_recursive(ast.right, ast.left))
  assert.equal(funs.is_loopable(ast.right, ast.left), loops[i])
})

