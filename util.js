var types = require('./types')

function isPrimitive (node) {
  return (
    node.type === types.number ||
    node.type === types.string ||
    node.type === types.boolean ||
    node.type === types.nil
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
  else if(isPrimitive(v))
    return v.value
  else
    throw new Error('cannot unmap node:'+inspect(v))
  
}

function bind (fn, scope, name) {
  return {
    type: types.fun,
    args: fn.args,
    body: fn.body,
    scope: scope,
    name: name || null
  }
}

module.exports = {unmap, isPrimitive, bind}