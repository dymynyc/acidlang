
find: import("./ast").find

is_call: {node name;
  neq(nil name) & eq(node.type $call) & eq(node.value.type $var) & eq(node.value.value name.value)
}

is_loopable: {fun name;
  gt(fun.args.length 0)
  & eq(fun.body.type $if)
  & not(is_call(fun.body.left name))
  & is_call(fun.body.mid name)
    ? not(is_call(fun.body.right name))
    ; is_call(fun.body.right name)
}


is_recursive: {fun name;
  eq(name.type $var) &
  find(fun.body {node;
    eq(node.type $call)
    & eq(node.value.type $var)
    & eq(node.value.value name.value)
  })
}

{ 
  is_loopable: is_loopable
  is_call: is_call
  is_recursive: is_recursive
  find: find
}
