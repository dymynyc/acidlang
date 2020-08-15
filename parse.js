var {And,Or,Maybe,Many,More,Join,Recurse,Group,Text,Expect,EOF}  = require('stack-expression')
var types = require('./types')

// m-expressions where an alternate form of lisp that they never got around to
// implementing, but is basically what js, c, and most other languages look like.
// https://en.wikipedia.org/wiki/M-expression

// except I'm sticking with space separation, adding a 
var __ = /^\s+/ //mandatory whitespace
var _  = /^\s*/ //optional whitespace

//note: json's string and number already captures.
var json = require('stack-expression/examples/json')

function OpenClose (op, item, cl, map) {
  return And(op, _, Group(Maybe(Join(item, __)), map), _, Expect(cl))
}

function Map (rule, mapper) {
  return function (input, start, end, group) {
    var g = []
    var m = rule(input, start, end, g)
    if(~m) group.push(mapper(g[0]))
    return m
  }
}

module.exports = function (symbols) {
  // filename = filename || ''
  symbols = symbols || {__proto__: types}
  function $ (str) {
    return symbols[str] = symbols[str] || Symbol(str)
  }
  

  //primitive values
  var nil_token = {type: types.nil, value: null }
  var nil = Text(/^nil/, () => nil_token)

  function Wrap (name) {
    return Map(json[name], (val) => ({type: types[name], value: val}))
  }
  var bool   = Wrap('boolean')
  var number = Wrap('number')
  var string = Wrap('string')

  var sym = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.symbol, value: $(text) }))

  var parse = And(_, Recurse (function (value) {
    //function calls (sneak "assignment" in as special case)
    var invocation = Or(
      //foo.bar=baz is just the same as foo(/bar baz) but only if bar is a literal symbol.
      And('.', _, Group(And(sym, Maybe(And(_, '=', _, value))))),
      OpenClose('(', value, ')')
    )
    
    //object literals
    var object = OpenClose('{', And(sym, _, ':', _, value), '}', function (pairs) {
      var obj = {}
      pairs.forEach(function (kv) {
        obj[kv[0]] = kv[1]
      })
      return {type: types.object, value: Object.seal(obj)} //prevent adding new fields (but allow mutation of current fields)
    })

    //arrays with square brackets. unlike javascript, don't make this also be property access. avoid ambiguity!
   
    var array = OpenClose('[', value, ']', (ary) => ({type: types.array, value: ary}))
    
    //function definitions
    var args = Join(sym, __)
    var fun = Group(And('{', _, args, _, ';', _, value, _, '}'), function (fun) {
      return {type: types.fun, args: fun[0], body: fun[1], scope: null}
    })
    
    return Or(string, number, nil, fun, object, array, Group(And(sym, Many(invocation)), function (calls) {
      if(calls.length === 1) return calls[0]
      return calls.reduce((val, args) => ({type: types.call, value: val, args: args}))
    }))
  }), _, EOF)

  return function (src) {
    var g = []
    if(~parse(src, 0, src.length, g)) return g[0]
    else throw new Error('could not parse')
  }

}
