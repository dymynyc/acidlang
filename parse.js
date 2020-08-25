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

function OpenClose (op, item, cl, map) {
  return And(op, _, Group(Maybe(Join(item, __)), map), _, Expect(cl))
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

function Map (rule, mapper) {
  var e = new Error()
  return function (input, start, end, group) {
    var captured
    return rule(input, start, end, (v) => {
        return group(mapper(v))
    })
  }
}

function Infix (rule, type, subrule) {
  return And(_, rule, _, Map(subrule, function (v) {
    return {type:type, left: null, right: v}
  }))
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
    return Map(json[name], (val) => ({type: types[name], value: val}))
  }
  
  var boolean   = Wrap('boolean')
  var number = Wrap('number')
  var string = Wrap('string')

  var sym = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.symbol, value: $(text) }))

  var value = Recurse (function (value) {
    //function calls (sneak "assignment" in as special case)
    var invocation = Or(
      //foo.bar=baz is just the same as foo(/bar baz) but only if bar is a literal symbol.
      And('(', _,')', Group(Empty)), //handle empty args specially
      And('.', _, Group(And(sym, Maybe(And(_, '=', _, value))))),
      OpenClose('(', value, ')'),
    )
    
    //object literals
    var object = OpenClose('{', Group(And(sym, _, ':', _, Expect(value))), Expect('}'), function (pairs) {
      var obj = {}
      pairs.forEach(function (kv) {
        obj[kv[0].value.description] = kv[1]
      })
      return {type: types.object, value: Object.seal(obj)} //prevent adding new fields (but allow mutation of current fields)
    })

    //arrays with square brackets. unlike javascript, don't make this also be property access. avoid ambiguity!
   
    var array = OpenClose('[', value, Expect(']'), (ary) => ({type: types.array, value: ary}))
    
    //function args can only be a symbols, so don't need to be wrapped.
    var args = Group(Maybe(Join(sym, __)), (args) => { return args.map(v => v.value)})
    
    //function definitions
    //something weird was going on trying to define functions with empty body?
    var fun = Group(And('{', _, args, _, ';', _, Or('}', And(Group(Join(value, __)), _, Expect('}'))), _), function (fun) {
      return {type: types.fun, args: fun[0], body: fun[1] ? fun[1] : Nil, scope: null, name: null}
    })

    var _value = Or(string, number, nil, boolean, fun, object, array, sym, value)

    // used places where a value definitely must happen
    var expected_value = Expect(value, 'expected acidlisp value')

    return Extend(_value, Or(
        Infix('&', types.and, expected_value),
        Infix('|', types.or, expected_value),
        Infix('=', types.set, expected_value),
        Infix(':', types.def, expected_value),
        Group(And(_, '?', _, expected_value, _, Expect(';'), _, expected_value, _), (args) => ({type:types.if, left: null, mid: args[0], right:args[1]})),
        Map(invocation, (args) => ({type: types.call, value: null, args})), 
      ), (left, right) => {
        if(right.type === types.call) right.value = left
        else                          right.left = left
        return right
    })
  })

  var _parse = And(_, Group(Join(value, __)), _, EOF)

  return function (src) {
    var g = []
    if(~_parse(src, 0, src.length, g.push.bind(g))) return g
    else throw new Error('could not parse')
  }
}
