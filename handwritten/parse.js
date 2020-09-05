var {And,Or,Maybe,Many,More,Join,Recurse,Group,Text,Expect,EOF,Empty,Not}  = require('stack-expression')
var $ = require('../symbols')
var types = require('../types')

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
      n += m
      m = extender(input, start+n, end, v => acc = reduce(acc, v))
    }
    if(acc) group(acc)
    return n
  }
}

function Map (rule, mapper) {
  return function (input, start, end, group) {
    return rule(input, start, end, (v) => {group(mapper(v))})
  }
}

function Infix (rule, type, subrule) {
  return And(rule, _, Map(subrule, function (v) {
    return {type:type, left: null, right: v}
  }, type))
}

function toBlock (body) { 
  return body ? body.length > 1 ? {type: types.block, body: body} : body[0] : Nil
}

module.exports = function () {
  //primitive values
  var Nil = {type: types.nil, value: null }
  //nil includes not check to ensure that it's not the start of a variable
  var azAZ09_ = /^[a-zA-Z0-9_]/
  var nil = Text(And(/^nil/, Not(azAZ09_)), () => Nil)

  function Wrap (rule, name) {
    return Map(rule, (val) => ({type: types[name], value: val}))
  }
  
  var boolean = Wrap(And(json.boolean, Not(azAZ09_)), 'boolean')
  var number  = Wrap(json.number, 'number')
  var string  = Wrap(json.string, 'string')

  var variable = Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.variable, value: $(text) }))
  var symbol = And('$', Text(/^[a-zA-Z_][a-zA-Z0-9_]*/, (text) => ({type: types.symbol, value: $(text) })))

  //function args can only be a symbols, so don't need to be wrapped.
  var args = List(variable) //Group(Maybe(Join(variable, __)))

  var value = Recurse (function (value) {
    // used places where a value definitely must happen
    var expected_value = Expect(value, 'expected acidlisp value')

    var invocation = OpenClose('(', value, ')', (args) => ({type: types.call, value: null, args}))

    var assignment = Maybe(And(_, '=', _, value))

    var access = And('.', _, Or(
      Group(And(variable, assignment), (args) => ({type: types.access, left: null, mid: args[0], right: args[1] || null, static: true})),
      Group(And('[', _, value, _, ']', assignment), (args) => ({type: types.access, left: null, mid: args[0], right: args[1] || null, static: false}))
    ))
 
    //object literals
    var key_value = Group(And(variable, _, ':', _, Expect(value)))
    var object = OpenClose('{', key_value, '}', function (pairs) {
      var obj = {}
      pairs.forEach((kv) => obj[kv[0].value.description] = kv[1])
      //seal to prevent adding new fields (but allow mutation of current fields)
      return {type: types.object, value: Object.seal(obj)}
    })

    //arrays with square brackets.
    //unlike javascript, don't make this also be property access. avoid ambiguity!
   
    var array = OpenClose('[', value, ']', (ary) => ({type: types.array, value: ary}))
    
    //function definitions
    //something weird was going on trying to define functions with empty body?
    var fun = Group(
      And('{', _, args, _, ';', _, List(value, toBlock), _, Expect('}')),
      (fun) => ({type: types.fun, args: fun[0], body: fun[1], scope: null, name: null})
    )

    var ternary = Group(And('?', _, expected_value, _, Expect(';'), _, expected_value), (args) => ({type:types.if, left: null, mid: args[0], right:args[1]}))

    var infixes =Or(
      Infix('&', types.and, expected_value),
      Infix('|', types.or,  expected_value),
      Infix('=', types.set, expected_value),
      Infix(':', types.def, expected_value),
      Infix('@', types.is,  expected_value)
    )

    //note: nil, boolean check that they do not extend into variable names,
    //and so much come before variable. There are not enough symbols to make them not potential variables.
    var unit = Or(string, number, symbol, nil, boolean, variable, fun, object, array)

    return Extend(unit, And(_, Or(infixes, ternary, invocation, access)),
      (left, right) => {
        if(right.type === types.call) right.value = left
        else                          right.left = left
        return right
    })
  })

  var _parse = And(_, List(value, toBlock), _, EOF)

  return function (src) {
    var g = []
    if(~_parse(src, 0, src.length, g.push.bind(g))) return g[0]
    else throw new Error('could not parse')
  }
}