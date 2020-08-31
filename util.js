var types = require('./types')
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

function unmap(v) {
  if(v.type === types.object) {
    var obj = {}
    for(var k in v.value)
      obj[k] = unmap(v.value[k])
    return Object.seal(obj)
  }
  if(v.type === types.array) {
    var length = v.value.length
    var ary = new Array(vlength)
    for(var i = 0; i < length; i++)
      ary[i] = unmap(v.value[i])
    return Object.seal(ary)
  }
  else if(isPrimitive(v) || types.type === v.type)
    return v.value
  else
    throw new Error('cannot unmap node:'+inspect(v))
  
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

module.exports = {unmap, isPrimitive, bind}