var assert = require('assert')
var parse = require('../parse')()
var ev = require('../eval')

var inputs = [
  'add(1 2)',
  '{a b; add(a b)}(3 4)',
  'true ? 10 ; -10',
  'true & true & false',
  'true | false',
  '{x;eq(and(x 1) 1) ? true ; false}(1)',
  '{x;eq(and(x 1) 1) ? true ; false}(4)',
//  '{;{;}}()'
//  'fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)) )}'
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(1)',
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(7)'
]

var outputs = [
  3,
  7,
  10,
  false,
  true,
  true,
  false,
  1,
  1*2*3*4*5*6*7
]

var scope = {
  add: function (a, b) { return a + b },
  and: function (a, b) { return a & b },
  mul: function (a, b) { return a * b },
  eq: function (a, b) { return a === b },
  
}

for(var i = 0; i < inputs.length; i++) {
  if(inputs[i]) {
    var ast = parse(inputs[i])
    console.log("SRC", inputs[i])
    console.log("AST", ast)
    var v = ev(ast, scope)
    console.log(v)
    assert.equal(v, outputs[i])
  }
}