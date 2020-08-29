args:{ary;
  join(map(ary compile) ", ")
}

"todo: make these into a library..."
"(no comments yet, but can put strings in a block)"

each:{ary reduce init;
  Array.isArray(ary) ? nil ; crash()
  R: {acc i; gt(ary.length i) ? R(reduce(acc ary.[i]) add(1 i)) ; acc}
  R(init 0)}

join:{a str; each(a {acc item; eq(acc "") ? item ; concat([acc str item])} "")}

map:{ary map;
  len: ary.length _ary: Array(len)

  R: {i; gt(len i) ? {; _ary.[i] = map(ary.[i]) R(add(1 i))}() ; _ary}
  R(0)
}

concat:{ary; eq(ary.length 0) ? ary.[0] ; each(ary {acc item; cat(acc item)} "")}

get_vars:{node;
  vars: ""
  R:{node;
    eq(node.type $block) ? each(node.body {acc i; R(i)} nil) ; 
    eq(node.type $fun) ? nil ;
    eq(node.type $def) ? {;
      vars = concat(eq(vars "") ?  ["var " compile(node.left)] ; [vars ", " compile(node.left)])
      R(node.right)
    }() ;
    eq(node.type $set) ? R(node.right) ;
    eq(node.type $if) ? {; R(node.left) R(node.mid) R(node.right) }() ;
    {;eq(node.type $and)|eq(node.type $or)}() ? {; R(node.left) R(node.right) }() ;
    eq(node.type $call) ? {; R(node.value) each(node.args {acc i; R(i)} nil) }() ;
    eq(node.type $array) ? each(node.args {acc i; R(i)} nil) ;
    nil
  }
  R(node)
  eq(vars "") ? "" ; concat([vars "; "])
}

compile_fun: {node name; 
  vars: get_vars(node.body)
  concat(
    eq(name nil)
    ? ["(" args(node.args) ") => "
        concat(eq(vars "")
        ? ["(" compile(node.body) ")"]
        ; ["{" vars "return " compile(node.body) "}"])
      ]
    ; ["(function " compile(name) " (" args(node.args) ") {"
        vars "return " compile(node.body) "})"]
  )
}

compile:{node;
  print(node)
  type:node.type
  
  concat(
    eq(type $boolean) ? [stringify(node.value)] ;
    eq(type $number)  ? [stringify(node.value)] ;  
    eq(type $variable)? [stringify(node.value)] ;  
    eq(type $nil)     ? ["null"] ;
    eq(type $is)      ? ["true"] ;
    {; eq(type $def) | eq(type $set) }()
                      ? [stringify(node.left.value) " = "
                          eq(node.right.type $fun)
                            ? compile_fun(node.right node.left) ; compile(node.right) ] ;
    eq(type $symbol)  ? ["$(" stringify(node.left.value) ")"] ;
    eq(type $if)      ? ["(" compile(node.left)  " ? "
                                     compile(node.mid)   " : "
                                     compile(node.right)  ")"] ;
    eq(type $and)     ? ["(" compile(node.left)  " ? "  
                                     compile(node.right) " : false )"] ;
    eq(type $or)      ? ["(" compile(node.left) " ? true ; "
                                     compile(node.right) ")"] ;
    eq(type $access)  ? ["(" compile(node.left)  "." compile(node.mid)
                             node.right ? concat(["=" compile(node.right)]) ; "" ")"] ;
    eq(type $call)    ? [ compile(node.value) "(" args(node.args) ")"] ;
    eq(type $fun)     ? [ compile_fun(node nil) ] ;
    eq(type $array)   ? ["[" args(node.value) "]"] ;
    eq(type $block)   ? ["(" args(node.body) ")"] ;
    eq(type $object)  ? ["{" join(map(node.value
                            {kv; concat([ compile(kv.key) ":" compile(kv.value)])})
                            ", ") "}"] ;
    ["crash('invalid node')"]
  )
}