
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

EQ: {x; {y; eq(x y) }}

each:{ary reduce init;
  
  R: {acc i; lt(i ary.length) ? R(reduce(acc ary.[i]) add(1 i)) ; acc}
  R(init 0)}

find_array: {ary fn;
  v:false //start out as false, incase the ary is empty
  R: {i; lt(i ary.length) & not(v = fn(ary.[i])) ? R(add(1 i)) ; v}
  R(0)
}

find_object: {obj fn;
  object_each(obj {s k v; s | fn(v) } false)
}
//inline fn, find_array then roll out R
find: {node fn;
  R:{node;
    c:EQ(node.type)
    fn(node)     ? true ;
    c($set)      ? R(node.left) | R(node.right) ;
    c($def)      ? R(node.left) | R(node.right) ;
    c($block)    ? find_array(node.body R) ;
    c($array)    ? find_array(node.value R) ;
    c($object)   ? find_object(node.value R) ;
    c($call)     ? R(node.value) | find_array(node.args R) ;
    c($access)   ? R(node.left) | R(node.mid) | neq(nil node.right) ? R(node.right) ; false ;
    c($if)       ? R(node.left) | R(node.mid) | R(node.right) ;
    c($and)      ? R(node.left) | R(node.right) ;
    c($or)       ? R(node.left) | R(node.right) ;
    c($is)       ? R(node.left) | R(node.right) ;
    c($fun)      ? find_array(node.args R) | R(node.body) ;
    c($var)      ? false ;
    c($symbol)   ? false ;
    c($number)   ? false ;
    c($string)   ? false ;
    c($boolean)  ? false ;
    c($nil)      ? false ;
                   crash("unknown node")
  }
  R(node)
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
}
