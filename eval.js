var types = require('./types')

function isPrimitive (node) {
  return (
    node.type === types.number ||
    node.type === types.string ||
    node.type === types.boolean ||
    node.type === types.nil
  )
}

function call (fn, args, scope) {
  //eval with built in function
  if('function' === typeof fn) {
    if(args.length !== fn.length)
      throw new Error('incorrect number of arguments for:'+fn)
    return fn.apply(null, args)
  }
  
  if(args.length !== fn.args.length)
    throw new Error('incorrect number of arguments for:'+fn)
  var _scope = {__proto__: scope}
  for(var i = 0; i < fn.args.length; i++)
    _scope[fn.args[i].description] = args[i]
  return ev(fn.body, _scope)
}

function ev (node, scope) {
  if(isPrimitive(node)) return node.value
  
  if(node.type === types.symbol) return scope[node.value.description]
  
  if(node.type === types.call) {
    //usually, this will be a lookup, but it be a function expression!
    var fn = ev(node.value, scope)
    return call(fn, node.args.map(a => ev(a, scope)), scope)
  }
  
  if(node.type === types.object) {
    var obj = {}
    for(var k in types.value)
      obj[k] = ev(node.value[k], scope)
    return obj
  }
  
  if(node.type === types.array) {
    var ary = new Array(node.value.length)
    for(var i = 0; i <  node.value.length; i++)
      ary[i] = ev(node.value[i], scope)
    return ary
  }
    
  if(node.type === types.fun)
    return {type: types.fun, args: node.args, body: node.body, scope: scope}
}

module.exports = ev