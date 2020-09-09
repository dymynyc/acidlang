var types = require('./types')
var HT = require('./hashtable')
var inspect = require('util').inspect

function isPrimitive (node) {
  return (
    node.type === types.number ||
    node.type === types.string ||
    node.type === types.boolean ||
    node.type === types.nil ||
    node.type === types.symbol
  )
}

function bind (fn, scope, name) {
  //check that argument vars are not duplicate
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
      scope.set(fn.args[i].value, values[i])
  }
  return ev(terminal, scope)
}

function calls (node, name) {
  return node.type === types.call && node.value.type === types.symbol && node.value.value === name
}

var True = {types: types.boolean, value: true}

function call (fn, args) {
  //eval with built in function
  if(!fn) throw new Error('cannot call undefined')
  if('function' === typeof fn) {
    return fn.apply(null, args)
  }
  if(fn.type !== types.fun) throw new Error('cannot call non-function')
  
  if(args.length !== fn.args.length)
    throw new Error('incorrect number of arguments for:'+inspect(fn, {colors:true})+', got:'+args)
  var _scope = HT(fn.scope)
  //TODO: check that name and args do not collide.
  if(fn.name)
    _scope.set(fn.name.value, fn)
  for(var i = 0; i < fn.args.length; i++)
    _scope.set(fn.args[i].value, args[i])
  

  //optimization for special case of recursion
  if(fn.name && fn.body.type === types.if) {
    if(calls(fn.body.mid, fn.name) ^ calls(fn.body.right, fn.name)) 
      return ev_loop(fn, _scope)
  }
  return ev(fn.body, _scope)
}

function ev_ab(node, scope) {
  var v = ev(node, scope)
  if(v.type !== types.boolean) throw new Error('expected boolean, was:'+inspect(v))
  return v
}

var True = {type: types.boolean, value: true}
var False = {type: types.boolean, value: false}

function ev_if(a,b,c, scope) {
  return ev_ab(a, scope).value === true ? ev(b, scope) : ev(c, scope)  
}

function ev (node, scope, allow_cyclic) {
  if(!node)  throw new Error('null node')
  if(!scope) throw new Error('missing scope')

  if(isPrimitive(node)) return {type:node.type, value: node.value}

  if(node.type === types.block) {
    for(var i = 0;i < node.body.length; i++)
      value = ev(node.body[i], scope)
    return value
  }
  
  if(node.type === types.variable) {
    var name = node.value
    if(!scope.has(name)) throw new Error('variable:'+name.description+' is not defined')
    var value = scope.get(name)
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
  
  if('function' === typeof node)
    return node

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
    return {type: types.array, value: ary}
  }
  
  if(node.type === types.def) {
    //handle function defs specially, to enable recursion
    var name = node.left.value
    if(scope.hasOwn(name.description))
      throw new Error('variable already defined:'+name.descripton+', cannot redefine')
    if(node.right.type === types.fun)
      return scope.set(name, bind(node.right, scope, node.left))
    else if(node.right.type === types.object) {
      var _obj = scope.set(name, {type: types.object, value: null, cyclic: true})
      var obj = scope.set(name, ev(node.right, scope, true))
      _obj.value = obj.value
      return obj
    }
    else {
      var value = ev(node.right, scope)
      return scope.set(name, value)
    }
  }
  //TODO: error if attempt to update an argument.
  if(node.type === types.set) {
    var name = node.left.value
    //handle function defs specially, to enable recursion
    if(!scope.has(name))
      throw new Error('attempted to assign undefined value:'+name.description)
    var value = ev(node.right, scope)
    if(scope.get(name).type !== value.type)
        throw new Error('attempted to assign value of type:'+value.type.description+
          ', to variable:'+name.description+' of type:'+
          scope.get(name).type.description)
    if(value.type === types.fun)
        throw new Error("cannot assign function type, must use : (define)")
          
    scope.get(name).value = value.value
    return scope.get(name)
  }

  if(node.type === types.access) {
    var left = ev(node.left, scope)
    var key = node.static ? node.mid : ev(node.mid, scope)
    if(left.type === types.object) {
      if(!left.value[key.value.description])
        throw new Error('object did not have property:'+node.mid.value.description)
      return !node.right ? left.value[key.value.description]
                         : left.value[key.value.description] = ev(node.right, scope)
    }
    else if(left.type === types.array) {
      if(key.type === types.number && (key.value > left.value.length || key.value < 0)) {
        return {type: types.nil, value: null}
      }
      else if(key.type === types.variable) {
          if(key.value !== types.length)
            throw new Error('cannot access property:'+key.value.description+' on array, only length')
          if(node.right)
            throw new Error("cannot assign to array length")
          return {type: types.number, value: left.value.length}
        }

      return !node.right ? left.value[key.value]
                         : left.value[key.value] = ev(node.right, scope)
    }
    else
      throw new Error('cannot access property:'+inspect(key) + ' of '+inspect(left))
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
