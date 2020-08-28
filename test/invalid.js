var assert = require('assert')
var parse = require('../parse')()
var ev = require('../eval')
var check = require('../check')

//inputs that parse correctly but incorrect types.

var inputs = [
  //wrong number of args.
  //in js this would just ignore 2nd arg.
  '{x; x}(1 2)',
  '{x; x}()',
  //non-existant property
  //in js this would just eval to undefined.
  'point:{x:1 y:2} point.z',
  //property access on non-object
  'foo:1 foo.bar',
  'point:{x:1 y:2} point.x.y',
  //numbers do not convert to boolean
  'nonz:{x; x ? true ; false} nonz(1)',
  'nonz:{x; x ? true ; false} nonz({foo:1})',
  'nonz:{x; x ? true ; false} nonz(nil)',

  //branch types of ?; must be same
  //can't do this in eval because only goes down one path.
  //need union types then checker and eval will be the same.
  //'maybe:{x y z; x ? y ; z} maybe(true 1 false)' 

  //cannot redefine same variable
  'foo: 1 foo: 2', 

  //cannot assign variable different type
  'foo: 1 foo = true',
 
  //cannot assign undefined variable
  'foo=true',
  //cannot use self reference as an argument
  'f:{x;} X:{y:f(X)}',
  'X:{y: X ? 1 ; 2}',
  //note: this is allowed. the body of the function isn't type checked until it's called.
  //'X:{y:{;X}}'
  //cannot repeat args
  '{x x;}'
]

var scope = {}
for(var i = 0; i < inputs.length; i++) {
  var failed = false
  var src = inputs[i]
  var ast = parse(src)
  console.log('*************')
  console.log(src)
  try {
  var v = ev(ast, {__proto__:scope})
    failed = true
  } catch(err) {
    console.log('expected:', err.message)
    assert.ok(err)
  }
 if(failed)
   throw new Error('expected eval to fail:'+src)

  try {
    var v = check(ast, {__proto__:scope})
    failed = true
  } catch(err) {
    console.log('expected:', err.message)
    assert.ok(err)
  }
  if(failed)
    throw new Error('expected check to fail:'+src)

}