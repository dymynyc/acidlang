var types = require('../../types')

exports.inputs = [
  'add(1 2)',
  '{a b; add(a b)}(3 4)',
  'true ? 10 ; -10',
  'true & true & false',
  'false & true & true',
  '{;false & true & true}()',
  'true | false',
  '{x; eq(and(x 1) 1) ? true ; false}(1)',
  '{x; eq(and(x 1) 1) ? true ; false}(4)',
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(1)',
  '{;fac:{n; eq(n 1) ? 1 ; mul(n fac(add(-1 n)))}}()(7)',
  '{; sq:{x m; gt(x m) ? x ; sq(mul(x x) m)}}()(2 10000)',
  '{x y; {x:x y:y}}(3 4)',
  '7 {; 1 2 3}()',
  'x:10 y:20 add(x y)',
  'xyz:{x:3 y:5 z:7} xyz.z',
  'a:{foo:{;123}} a.foo()',
  '{e; {;e}}(987)()',
  '{f; f(f)}({g;{x;{;x}}})(349783)()',
  'x:1 x@i32',
  'Obj:{x:i32 y:i32 z:i32} obj:{x:1 y:1 z:1} obj@Obj',
  'a:{self:a}', //cyclic!
  'deep:{a:{b:{c:deep}}}',
 '$object'
]

function T (s, v) { return {type: s, value: v === undefined ? null : v}}
function N(v) { return T(types.number, v) }
function B(v) { return T(types.boolean, v) }
function O(v) { return T(types.object, v) }

var cyclic = {type:types.object, value: {self:{type: types.object, value:null, cyclic: true}}}
cyclic.value.self.value = cyclic.value

var cyclic2 = O({a:O({b:O({c:null})})})
cyclic2.value.a.value.b.value.c = {type: types.object, value: cyclic2.value, cyclic: true}

exports.outputs = [
  N(3), N(7), N(10),
  B(false), B(false), B(false), B(true), B(true), B(false),
  N(1), N(1*2*3*4*5*6*7), N(65536),
  O({x: N(3), y: N(4)}),
  N(3), N(30), N(7), N(123),
  //true,
  N(987), N(349783),
  B(true), B(true),
  cyclic, cyclic2,
  T(types.symbol, types.object)
]

var cyclic_raw = {self:null}
cyclic_raw.self = cyclic_raw
var cyclic2_raw = {a:{b:{c:null}}}
cyclic2_raw.a.b.c = cyclic2_raw
exports.output_values = [
  3,7,10,false,false, false,true, true,false,1,1*2*3*4*5*6*7,65536,
  {x:3,y:4},3,30,7,123,987,349783,true,true, cyclic_raw, cyclic2_raw, types.object
]