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
      scope[fn.args[i].value.description] = values[i]
  }
  return ev(terminal, scope)
}

function calls (node, name) {
  return node.type === types.call && node.value.type === types.symbol && node.value.value === name
}

var True = {types: types.boolean, value: true}
function call (fn, args) {
  //eval with built in function
  //if(!scope) throw new Error('call without scope')
  if(!fn) throw new Error('cannot call undefined')
  if('function' === typeof fn) {
    if(args.length !== fn.length) {
      throw new Error('incorrect number of arguments for:'+fn+', got:'+args)
    }
    var _value = fn.apply(null, args.map(v => v.value))
    return (
      'boolean' === typeof _value ? {type:types.boolean, value: _value} :
      'number'  === typeof _value ? {type:types.number,  value: _value} :
      'string'  === typeof _value ? {type:types.string,  value: _value} :
      null === _value             ? {type: types.nil,    value: _value} :
      (function () { throw new Error('built ins must only return primitives') })()
    )
  }
  
  if(args.length !== fn.args.length)
    throw new Error('incorrect number of arguments for:'+inspect(fn, {colors:true})+', got:'+args)
  var _scope = {__proto__: fn.scope}
  //TODO: check that name and args do not collide.
  if(fn.name)
    _scope[fn.name.value.description] = fn 
  for(var i = 0; i < fn.args.length; i++)
    _scope[fn.args[i].value.description] = args[i]
  

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

function ev (node, scope, allow_cyclic) {
  if(!node)  throw new Error('null node')
  if(!scope) throw new Error('missing scope')

  if(isPrimitive(node)) return node

  if(node.type === types.block) {
    for(var i = 0;i < node.body.length; i++)
      value = ev(node.body[i], scope)
    return value
  }
  
  if(node.type === types.variable) {
    var name = node.value
//    console.log('scope', scope, scope.__proto__, scope.__proto__.proto__)
    if(!scope[name.description]) throw new Error('variable:'+name.description+' is not defined')
    var value = scope[name.description]
    if(value.type === types.object && value.cyclic && !allow_cyclic)
      throw new Error('cyclic reference must not be used outside of object literal')
    return value
  }

  if(node.type === types.symbol)
    return node

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
      obj[k] = ev(node.value[k], scope, allow_cyclic)
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
    if(node.right.type === types.fun)
      return scope[name.description] = bind(node.right, scope, node.left)
    else if(node.right.type === types.object) {
      var _obj = scope[name.description] = {type: types.object, value: null, cyclic: true}
      var obj = scope[name.description] = ev(node.right, scope, true)
      _obj.value = obj.value
      return obj
    }
    else
     return scope[name.description] = ev(node.right, scope)
  }

  if(node.type === types.set) {
    var name = node.left.value
    //handle function defs specially, to enable recursion
    if(!scope[name.description])
      throw new Error('attempted to assign undefined value')
    var value = ev(node.right, scope)
    if(scope[name.description].type !== value.type)
        throw new Error('attempted to assign value of type:'+value.type.description+
          ', to variable:'+name.description+' of type:'+
          scope[name.description].type.description)
    return scope[name.description] = value
  }

  if(node.type === types.access) {
    var left = ev(node.left, scope)
    if(left.type !== types.object)
      throw new Error('access on non-object')
    var key = node.mid.type === types.variable ? node.mid.value.description : ev(node.mid, scope)
    if(left.type === types.object) {
      if(!left.value[node.mid.value.description])
        throw new Error('object did not have property:'+node.mid.value.description)
    }
    else if(left.type === types.array) {
      if(key.type === types.number && (key.value > left.value.length || key.value < 0)) {
        return {type: types.nil, value: null}
        //throw new Error('array index out of bounds')
      }
      else
        if(key.type === types.variable && key.value !== types.length)
          throw new Error('cannot access property:'+key.value.description+' on array, only length')
    }
    else
      throw new Error('cannot access property:'+inspect(key) + ' of '+inspect(left))
    if(!node.right) return left.value[key]
    else            return left.value[key] = ev(node.right, scope)    
  }

  if(node.type === types.fun)
    return bind(node, scope)
  
  if(node.type === types.is) {
    var left = ev(node.left, scope)
    var right = ev(node.right, scope)
    ;(function is (left, right) {
      if(right.type === types.object) {
        for(var k in right.value)
          is(left.value[k], right.value[k])
      }
      else if(left.type !== right.value)
      throw new Error('type assertion failed')
    })(left, right)
    return True
  }
  
  throw new Error('cannot eval:'+inspect(node))
}

module.exports = ev
