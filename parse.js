var {And,Or,Maybe,Many,More,Join,Recurse,Group,Text,Expect,EOF}  = require('stack-expression')
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
  return function (input, start, end, group) {
    var captured
    var m = rule(input, start, end, (v) => group(mapper(v)))
    return m
  }
}

function Infix (rule, type, subrule) {
  return And(_, rule, _, Map(subrule, function (v) {
    return {type:type, left: null, right: v}
  }))
}

function createCall (fn, args) {
  if(fn.type === types.symbol) {
    if(fn.value === types.if) {
      return {type: fn.value, test: args[0], then: args[1], else: args[2]}
    }
    //note: using reduceRight and then switching a and b gives or(a or(b c)) instead of or(or(a b) c)
    //same difference but should mean less expressions are evaluated
    else if(fn.value === types.and || fn.value === types.or)
      return args.reduceRight((a, b) => ({type: fn.value, left: b, right: a}))
  }
  return {type: types.call, value: fn, args: args}
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
  var boolean   = Wrap('boolean')
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
    
    //function args can only be a symbols, so don't need to be wrapped.
    var args = Group(Join(sym, __), (args) => { return args.map(v => v.value)})

    //function definitions
    var fun = Group(And('{', _, args, _, ';', _, value, _, '}'), function (fun) {
      return {type: types.fun, args: fun[0], body: fun[1], scope: null}
    })

    var _value = Or(string, number, nil, boolean, fun, object, array, sym, value)

    return Extend(_value, Or(
        Infix('&', types.and, value),
        Infix('|', types.or, value),
        Group(And(_, '?', _, value, _, ':', _, value), (args) => ({type:types.if, left: null, mid: args[0], right:args[1]})),
        Map(invocation, (args) => ({type: types.call, value: null, args})), 
      ), (left, right) => {
        if(right.type === types.call) right.value = left
        else                          right.left = left
        return right
    })

    // return Group(_value, Many(invocation)), function (calls) {
      // if(calls.length === 1) return calls[0]
      // else return calls.reduce(createCall)
    // })

  }), _, EOF)

  return function (src) {
    var g = []
    if(~parse(src, 0, src.length, g.push.bind(g))) return g[0]
    else throw new Error('could not parse')
  }
}
