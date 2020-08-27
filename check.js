var types = require('./types')
var inspect = require('util').inspect
var {isPrimitive} = require('./util')

var Boolean = {type: types.boolean, value: null}
var True = {type: types.boolean, value: true}

function assertType(actual, expected) {
  // if(actual.type !== types.type)
  // throw new Error('expected `actual` to be type object, was:' + inspect(actual))
  // if(expected.type !== types.type)
  //  throw new Error('expected `expected` to be a type object, was:' + inspect(expected))
  //in some cases, a variable is created before we know the type,
  //so assign it here. I wonder if this will work?
  if(expected.type === null)
    expected.type = actual.type
  else if(actual.type === null)
    actual.type = expected.type
  else if(actual.type !== expected.type) {
    console.log('types', actual, expected)
    throw new Error('expected:'+expected.type.description+', got:'+actual.type.description)
  }
  return actual
}

function Unknown () {
  return {type: null, value: null}
}

function TypeSig () {
  return {type: types.typesig, args: null, returns: null}
}

function bind (fn, scope, name) {
  fn.sig = TypeSig()
  return {
    type: types.fun,
    args: fn.args,
    body: fn.body,
    scope: scope,
    name: name || null,
    sig: fn.sig
  }
}

function call (fn, args) {
  var scope = fn.scope
//  if(!scope) throw new Error('call without scope')
  if(!fn) throw new Error('cannot call undefined')

  //check if we have already figured out the types for this function.
  if(fn.sig && fn.sig.args && fn.sig.returns) fn = fn.sig

  //in eval, fn might be a js function, but here it's a type signature object
  if(fn.type === types.typesig) {
    var sig = fn
    if(sig.args.length != args.length)
      throw new Error('incorrect number of arguments')
    for(var i = 0; i < sig.args.length; i++)
      assertType(args[i], sig.args[i])
    return sig.returns
  }
  if(fn.type === types.fun) {
    var _scope = {__proto__:scope}
    var sig = fn.sig
    //{type: types.typesig, args: fn.args.map(Unknown), returns: Unknown()}
    sig.args = fn.args.map(Unknown)
    if(sig.args.length != args.length)
      throw new Error('incorrect number of arguments')
    sig.returns = Unknown()
    for(var i = 0; i < fn.args.length; i++) {
      var name = fn.args[i]
      _scope[name.description] = args[i]
      //remember the type we are using
      sig.args[i].value = args[i].value
    }
    if(fn.name)
      _scope[fn.name.description] = fn
    var v = check(fn.body, _scope)
    return sig.returns = v
  }
  throw new Error('unknown call type:'+inspect(fn))
}

function check (node, scope) {
  if(isPrimitive(node))
    return node //{type: types.type, value: node.type}

  if(Array.isArray(node)) {
    var value
    for(var i = 0; i < node.length; i++)
      value = check(node[i], scope)
    return value
  }

  if(node.type === types.symbol) {
    if(!scope[node.value.description])
      throw new Error('symbol:'+node.value.description+' is not defined')
    return scope[node.value.description]
  }

  if(node.type === types.call) {
    var fn = check(node.value, scope)
    return call(fn, node.args.map(v => check(v, scope)), scope)
  }

  if(node.type === types.access) {
    var left = check(node.left, scope)
    var name = node.mid.value
    if(!left.value[name.description])
      throw new Error('did not have property:'+name.description)
    return node.right ? check(node.right, scope) : left.value[name.description]
  }
  
  if(node.type === types.if) {
    assertType(check(node.left, scope), Boolean)
    var m = check(node.mid, scope)
    var r = check(node.right, scope)
    //todo: implement a way to express union types.
    if(!assertType(m, r))
      throw new Error('if branches must have same type, was:'+inspect(m)+', '+inspect(r))
    return m
  }

  //and/or always returns boolean
  if(node.type === types.and || node.type === types.or) {
    assertType(check(node.left, scope), Boolean)
    assertType(check(node.right, scope), Boolean)
    return Boolean //unknown boolean
  }
  
  if(node.type === types.object) {
    //throw new Error('type checks for objects not yet implemented')
    var obj = {}
    for(var k in node.value)
      obj[k] = check(node.value[k], scope)
    return {type: types.object, value: obj}
  }
  if(node.type === types.array) {
    //an array of whatever
    throw new Error('type checks for arrays not yet implemented')
  }
  if(node.type === types.def) {
    var name = node.left.value
    if(Object.hasOwnProperty.call(scope, name.description)) {
      throw new Error('variable already defined:'+name.description+', cannot redefine')
    }
    if(node.right.type === types.fun)
      return scope[name.description] = bind(node.right, scope, name)
    else if(node.right.type === types.object) {
      var _obj = scope[name.description] = {type: types.object, value: null, cyclic: true}
      var obj = check(node.right, scope)
      _obj.value = obj.value
      return obj
    }
    else
      return scope[name.description] = check(node.right, scope)
  }
 
  if(node.type === types.set) {
    var name = node.left.value
    //handle function defs specially, to enable recursion
    if(!scope[name.description])
      throw new Error('attempted to assign undefined value')
    var type = scope[name.description]
    var _type = check(node.right, scope)
    if(type.value !== _type.value)
      throw new Error('variable already declared as type:'+type.value.description+ ', cannot reassign to type:'+_type.value.description)      
    return type
  }

  if(node.type === types.fun)
    return bind(node, scope)

  if(node.type === types.is) {
    var left = check(node.left, scope)
    var right = check(node.right, scope)
    console.log("IS", left, right)
    assertType(left, right.type === types.object ? right : {type: right.value, value: null})
    return True
  }

  throw new Error('cannot check:'+inspect(node))
}

module.exports = check
