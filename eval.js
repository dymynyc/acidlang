var types = require('./types')
var inspect = require('util').inspect
var {isPrimitive, bind} = require('./util')
//take a recursive expression and process it as a loop
//this is much faster and also prevents stack overflows.
//when we get to compliation we'll compile it like this too.
function ev_loop(fn, scope) {
  var test = fn.body.left, update, terminal, not

  if(calls(fn.body.mid, fn.name)) {
    update = fn.body.mid.args
    terminal = fn.body.right
    not = false
  }
  else {
    update = fn.body.right.args
    terminal = fn.body.mid
    not = true
  }
  while(ev_ab(test, scope).value ^ not) {
    var values = update.map(e => ev(e, scope))
    for(var i = 0; i < fn.args.length; i++)
      scope[fn.args[i].description] = values[i]
  }
  return ev(terminal, scope)
}

function calls (node, name) {
  return node.type === types.call && node.value.type === types.symbol && node.value.value === name
}

function call (fn, args, scope) {
  //eval with built in function
  if(!scope) throw new Error('call without scope')
  if(!fn) throw new Error('cannot call undefined')
  if('function' === typeof fn) {
    if(args.length !== fn.length) {
      throw new Error('incorrect number of arguments for:'+fn+', got:'+args)
    }
    var _value = fn.apply(null, args.map(v => v.value))
    return 'boolean' === typeof _value ? {type:types.boolean, value: _value} : {type:types.number, value: _value}
  }
  
  if(args.length !== fn.args.length)
    throw new Error('incorrect number of arguments for:'+inspect(fn, {colors:true})+', got:'+args)
  var _scope = {__proto__: scope}
  if(fn.name)
    _scope[fn.name.description] = fn 
  for(var i = 0; i < fn.args.length; i++)
    _scope[fn.args[i].description] = args[i]


  //optimization for special case of recursion
  if(fn.name && fn.body.type === types.if) {
    if(calls(fn.body.mid, fn.name) ^ calls(fn.body.right, fn.name)) 
      return ev_loop(fn, _scope)
  }
  return ev(fn.body, _scope)
}

function ev_ab(node, scope) {
  var v = ev(node, scope)
  if(v.type !== types.boolean) throw new Error('expected boolean')
  return v
}

var True = {type: types.boolean, value: true}
var False = {type: types.boolean, value: true}

function ev_if(a,b,c, scope) {
  if(ev_ab(a, scope).value === true) return ev(b, scope)
  else return ev(c, scope)  
}

function ev (node, scope) {
  if(!node)  throw new Error('null node')
  if(!scope) throw new Error('missing scope')

  if(isPrimitive(node)) return node

  if(Array.isArray(node)) {
    for(var i = 0;i < node.length; i++)
      value = ev(node[i], scope)
    return value
  }
  
  if(node.type === types.symbol) {
    var name = node.value
    if(!scope[name.description]) throw new Error('variable:'+name.description+' is not defined')
    return scope[name.description]
  }

  if(node.type === types.call) {
    //usually, this will be a lookup, but it be a function expression!
    var fn = ev(node.value, scope)
    return call(fn, node.args.map(a => ev(a, scope)), scope)
  }

  if(node.type === types.if)  return ev_if(node.left, node.mid, node.right, scope)
  if(node.type === types.and) return ev_if(node.left, node.right, False, scope)
  if(node.type === types.or)  return ev_if(node.left, True, node.right, scope)
  
  if(node.type === types.object) {
    var obj = {}
    for(var k in node.value)
      obj[k] = ev(node.value[k], scope)
    return {type: types.object, value: Object.seal(obj)}
  }
  
  if(node.type === types.array) {
    var ary = new Array(node.value.length)
    for(var i = 0; i <  node.value.length; i++)
      ary[i] = ev(node.value[i], scope)
    return ary
  }
  
  if(node.type === types.def) {
    //handle function defs specially, to enable recursion
    var name = node.left.value
    if(Object.hasOwnProperty.call(scope, name.description))
      throw new Error('variable already defined:'+name.descripton+', cannot redefine')
    return scope[name.description] = 
      node.right.type === types.fun ? bind(node.right, scope, name) : ev(node.right, scope)
  }

  if(node.type === types.set) {
    var name = node.left.value
    //handle function defs specially, to enable recursion
    if(!scope[name.description])
      throw new Error('attempted to assign undefined value')
    return scope[name.description] = ev(node.right, scope)
  }

  if(node.type === types.access) {
    var left = ev(node.left, scope)
    if(left.type !== types.object)
      throw new Error('access on non-object')
    if(!left.value[node.mid.value.description])
      throw new Error('object did not have property:'+node.mid.value.description)
    console.log('access', node, left, left.value[node.mid.value.description])
    if(!node.right)
      return left.value[node.mid.value.description]
    else
      return left.value[node.mid.value.description] = ev(node.right, scope)    
    
  }

  if(node.type === types.fun)
    return bind(node, scope)
}

module.exports = ev
