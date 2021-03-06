var types = require('./types')
var inspect = require('util').inspect
var ev = require('./eval')
var HT = require('./hashtable')

function isPrimitive (node) {
  return (
    node.type === types.number ||
    node.type === types.string ||
    node.type === types.boolean ||
    node.type === types.nil ||
    node.type === types.symbol
  )
}

//TODO: support cyclic
function unmapValue(v) {
  if(v.type === types.object) {
    var obj = {}
    for(var k in v.value)
      obj[k] = unmapValue(v.value[k])
    return Object.seal(obj)
  }
  if(v.type === types.array) {
    var length = v.value.length
    var ary = new Array(length)
    for(var i = 0; i < length; i++)
      ary[i] = unmapValue(v.value[i])
    return Object.seal(ary)
  }
  else if(isPrimitive(v) || types.type === v.type)
    return v.value
  else if('function' === typeof v) {
    return v.original || v //unwrap
  }
  else if(v.type === types.fun)
    return function () {
      var args = [].map.call(arguments, mapValue)
      return unmapValue(ev({type: types.call, value: v, args: args}, v.scope))
    }
  else {
    throw new Error('cannot unmap node:'+inspect(v))
  }
}
//TODO: support cyclic
function mapValue (ast) {
  if('number' === typeof ast)
    return {type: types.number, value: ast}
  if('symbol' === typeof ast)
    return {type: types.symbol, value: ast}
  if('string' === typeof ast)
    return {type: types.string, value: ast}
  if('boolean' === typeof ast)
    return {type: types.boolean, value: ast}
  if(null === ast)
    return {type: types.nil, value: null}
  if(Array.isArray(ast))
    return {type: types.array, value: ast.map(mapValue)}
  //must be object...
  if('function' === typeof ast) {
    return wrap(ast)
  }
  var obj = {}
  for(var k in ast)
    obj[k] = mapValue(ast[k])
  return {type: types.object, value: obj}
}

function bind (fn, scope, name) {
  for(var i = 0; i < fn.args.length;i++)
    for(var j = i+1; j < fn.args.length;j++)
      if(fn.args[i].value == fn.args[j].value)
        throw new Error('arg:'+fn.args[i].value.description+' was repeated')
  return {
    type: types.fun,
    args: fn.args,
    body: fn.body,
    scope: scope,
    name: name || null
  }
}

function wrap(fn) {
  if('function' !== typeof fn) return fn
  function wrapped () {
    return mapValue(fn.apply(null, [].map.call(arguments, unmapValue)))
  }
  wrapped.original = fn
  return wrapped
}
var scope = require('./env')

function wrappedEval (ast) {
  var _scope = {}
  for(var k in scope) _scope[k] = wrap(scope[k])
  return ev(ast, HT(new Map(Object.entries(_scope))))
}

function print (x) {
  console.log('string' === typeof x ? x : inspect(x, {colors: process.stdout.isTTY, depth: Infinity}))
}

module.exports = {unmapValue, mapValue, isPrimitive, bind, wrap, eval: wrappedEval, print}