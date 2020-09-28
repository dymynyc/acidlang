var types = require('./types')
var inspect = require('util').inspect
var ev = require('./handwritten/eval')
var HT = require('./hashtable')

var wmap = new Map()
var _wmap = new Map()

function isPrimitive (node) {
  return (
    node.type === types.number ||
    node.type === types.string ||
    node.type === types.boolean ||
    node.type === types.nil ||
    node.type === types.symbol
  )
}

function unmapValue(v) {
  if(_wmap.has(v)) {
  //  console.log("unmap", v, _wmap.get(v))
//    return _wmap.get(v)
  }
  var _v = _unmapValue(v)
  _wmap.set(v, _v)
  if(_v && 'object' === typeof _v)
    wmap.set(_v, v)
  return _v
}
function _unmapValue(v) {
  if(v.type === types.object) {
    var obj = {}
    _wmap.set(v, obj)
    wmap.set(obj, v)
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

function mapValue (value) {
  if('undefined' === typeof value)
    throw new Error('cannot unmap undefined')
  if('number' === typeof value)
    return {type: types.number, value: value}
  if('symbol' === typeof value)
    return {type: types.symbol, value: value}
  if('string' === typeof value)
    return {type: types.string, value: value}
  if('boolean' === typeof value)
    return {type: types.boolean, value: value}
  if(null === value)
    return {type: types.nil, value: null}
  
  //if(wmap.has(value)) return wmap.get(value)
  
  if(Array.isArray(value)) {
    var a = {type: types.array, value: null}
    wmap.set(value, a)
    a.value = value.map(mapValue)
    return a
  }
  //must be object...
  if('function' === typeof value) {
    return wrap(value)
  }
  var obj = {type: types.object, value: {}}
  wmap.set(value, obj)
  for(var k in value)
    obj.value[k] = mapValue(value[k])
  return obj
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