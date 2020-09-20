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

  //print(ast = uniquify(0)(ast))
  console.log('result', result)
//  assert.deepEqual(ev(ast), result, 'uniquify should not change meaning')
  //print(uniquify(0)(ast))
  console.log("INLINE")
  ast = inline(ast)
   print(ast)
  assert.deepEqual(ev(ast), result, 'inline should not change meaning')
  console.log(compile(ast, nop))
}

;[
  'suc:{val; add(val 1)} suc(7)',
  'create:{val; {diff; add(val diff)}} counter: create(3) counter(7)',
  'foo:{f; f(7)} foo({x; mul(x x)})',
  'foo:{x; y:mul(x 2) {z; mul(y z)}} foo(3)(5)',
  'bar:{;1} baz: bar()',
  'foo:{f; f(7)} y:foo({x; mul(x x)}) y=foo({z; mul(z mul(z z))}) y',
  //note: will need to remove functions from objects.
  //this should probably inline as obj.foo not 11, incase obj.foo is mutated.
//  'obj:{foo: 11 bar: {; obj.foo}} obj.bar()',
  '{fn; fn(21)}({x; mul(x 3)})',

   `{ary fn;
       [fn(ary.[0]) fn(ary.[1]) fn(ary.[2])]
   }([1 2 3] {x; gt(x 2)})
  `,
  `
    {ary;
      ary.length
    }([1 2 3])
  `,
   `
  fn: {x; gt(x 2) }
  R:{i; fn(i)}
  R(0)
`
,   `
  {ary fn;
    v:false
    R:{i; {; lt(i ary.length) & not(v=fn(ary.[i]))}() ? R(add(1 i)) ; v }
    R(0)
  }([1 2 3] {x; gt(x 2) })
`
//  'R:{; R()}'
].forEach(test)

//how to handle recursive functions? if the function is loopable
//it can be inlined as a loop. if it's still recursive it needs to be rolled out.
//if it's rolled out, anything from our scope needs to be inlined.
//if it also updates closed over variables then we need to spin those vars out.
//if the calling function is not reentrant, then we can use a global var.
//else we need to allocate a var on the stack.

//okay first step is to just leave recursive functions in their place,
//but to inline functions passed to them.
/*
  //can inline update, but keep R
  R:{acc i; lt(i 10) ? R(update(acc i) add(i 1)) ; acc }
  R(0 0)
*/
//hmm... if everything is unique, then can just move the function definition outside?
//as long as it doesn't have free variables. would have to move the free variables out too.
