var {And,Or,Maybe,Many,More,Join,Recurse,Group,Text,Expect,EOF,Empty}  = require('stack-expression')
var types = require('./types')

// m-expressions were an alternate form of lisp that they never got around to
// implementing, but is basically what js, c, and most other languages look like.
// https://en.wikipedia.org/wiki/M-expression

// except I'm sticking with space separation

var __ = /^\s+/ //mandatory whitespace
var _  = /^\s*/ //optional whitespace

//note: json's string and number already captures.
var json = require('stack-expression/examples/json')

function List(val, map) {
  return Group(Maybe(Join(val, __)), map)
}

function OpenClose (op, item, cl, map) {
  return And(op, _, List(item, map), _, Expect(cl))
}

function Extend (prefix, extender, reduce) {
  return function (input, start, end, group) {
    var acc, n = 0
    var m = prefix(input, start, end, v => acc = v)
    if(!~m)return -1
    while(~m) {
      g = []
      n += m
      m = extender(input, start+n, end, v => acc = reduce(acc, v))
    }
    if(acc) group(acc)
    return n
  }
}

function Map (rule, mapper, type) {
  var e = new Error()
  return function (input, start, end, group) {
    return rule(input, start, end, (v) => {group(mapper(v))})
  }
}

function Infix (rule, type, subrule) {
  return And(_, rule, _, Map(subrule, function (v) {
    return {type:type, left: null, right: v}
  }, type))
}

module.exports = function (symbols) {
  // filename = filename || ''
  symbols = symbols || {__proto__: types}
  function $ (str) {
    return symbols[str] = symbols[str] || Symbol(str)
  }

  //primitive values
  var Nil = {type: types.nil, value: null }
  var nil = Text(/^nil/, () => Nil)

  function Wrap (name) {
    return Map(json[name], (val) => ({type: types[name], value: val}), name)
  }
  
  var boolean = Wrap('boolean')
  var number  = Wrap('number')
  var string  = Wrap('string')

  var variable = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.variable, value: $(text) }))
  var symbol = And('$', Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.symbol, value: $(text) })))

  //function args can only be a symbols, so don't need to be wrapped.
  var args = List(variable) //Group(Maybe(Join(variable, __)))

  var value = Recurse (function (value) {
    var invocation = OpenClose('(', value, ')')
    
    var assignment = Maybe(And(_, '=', _, value))
    var access = And('.', _, Or(
      Group(And(variable, assignment), (args) => ({type: types.access, left: null, mid: args[0], right: args[1] || null, static: true})),
      Group(And('[', _, value, _, ']', assignment), (args) => ({type: types.access, left: null, mid: args[0], right: args[1] || null, static: false}))
    ))
    //object literals
    var kv = Group(And(variable, _, ':', _, Expect(value)))
    var object = OpenClose('{', kv, '}', function (pairs) {
      var obj = {}
      pairs.forEach((kv) => obj[kv[0].value.description] = kv[1])
      return {type: types.object, value: Object.seal(obj)} //prevent adding new fields (but allow mutation of current fields)
    })

    //arrays with square brackets. unlike javascript, don't make this also be property access. avoid ambiguity!
   
    var array = OpenClose('[', value, ']', (ary) => ({type: types.array, value: ary}))
    
    //function definitions
    //something weird was going on trying to define functions with empty body?
    var fun = Group(
      And('{', _, args, _, ';', _, List(value), _, Expect('}')),
      (fun) => ({type: types.fun, args: fun[0], body: fun[1] ? fun[1] : Nil, scope: null, name: null})
    )

    // used places where a value definitely must happen
    var expected_value = Expect(value, 'expected acidlisp value')

    var unit = Or(string, number, nil, boolean, variable, symbol, fun, object, array)

    return Extend(unit, And(_, Or(
        Infix('&', types.and, expected_value),
        Infix('|', types.or,  expected_value),
        Infix('=', types.set, expected_value),
        Infix(':', types.def, expected_value),
        Infix('@', types.is,  expected_value),
        Group(And('?', _, expected_value, _, Expect(';'), _, expected_value), (args) => ({type:types.if, left: null, mid: args[0], right:args[1]})),
        Map(invocation, (args) => ({type: types.call, value: null, args})),
        access
      )), (left, right) => {
        if(right.type === types.call) right.value = left
        else                          right.left = left
        return right
    })
  })

  var _parse = And(_, List(value), _, EOF)

  return function (src) {
    var g = []
    if(~_parse(src, 0, src.length, g.push.bind(g))) return g
    else throw new Error('could not parse')
  }
}