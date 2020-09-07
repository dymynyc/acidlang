var hand_parser = require('../handwritten/parse')()
var acid_parser = require('../parse')()
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var src = fs.readFileSync(path.join(__dirname, '../parse.al'), 'utf8')
var inspect = require('util').inspect

var inputs = [
  'x . y',
  'x. [1]',
  'x.\ny',
  'x . [ 1]',
  'x.[ 1 ]',
  '{x; x ? 1 ; {;2}() }', //this works!
  '{;}  ( x )',
  '[1 2 3 ]',
 'foo (x y )',
  'plus(1 2)',
  'def(a 1)',
  'def.a=1',
  '[a b c]',
  '"string"',
  '["A" "B" "C"]',
  '{a; plus(a 1)}',
  '{a b; plus(a b)}',
  '{a; plus(a 1)}(2)',
  '{x; {y; plus(x y)}}(1)(2)',
  '{foo:1 bar:2}',
  'or(a b c)',
  'a|b|c',
  'A | B | C',
  'if(a b c)',
  'a?b;c',
  'A ? B ; C',
  'X = Y',
  'X : Y',
  'foo:{x y z; plus(x y z)}',
  'fib:{n; eq(n 0) ? 1 ; eq(n 1) ? 1 ; add(fib(sub(n 1)) fib(sub(n 2)))}(5)',
  'true',
  '{;1}',
  '{;}',
  '{; }',
  '{ ;}',
  '{;{;}}',
  '{;{;}}',
  'sum:{n; eq(n 0) ? 0 ; add(1 sum(sub(n 1)))}',
  'x:y:z:0',
  '{;1}()',
  '{k v; {key: k value: v}}',
  'z:1 {;1 x:3}',
  'x@i32',
  '{foo: 1 & 2}',
  '{foo: true ? 1 ; 2}',
  'a ? b ? c ; d ; e',
  'a.[1]',
  'a.[0]=1',
  src
]
function tests (parsers) {
  for(var i = 0; i < inputs.length; i++) {
    console.log("parse:", inputs[i])
    var results = []
    for(var k in parsers) {
      var v = parsers[k](inputs[i])
      console.log(inspect(v, {depth: Infinity, colors: true}))
      results.push(v)
    }
//    assert.equal(inspect(results[1]), inspect(results[0]))
  }
}
tests({hand: hand_parser, acid: acid_parser})

//a ? b : c

//a ? b_a ? b_b : b_c : c
//a_a ? a_b : a_c ? b : c

