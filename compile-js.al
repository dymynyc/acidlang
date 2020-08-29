args:{ary; join(map(ary compile) ", ") }

"TODO: needs object support, then should be able to compile itself"

"todo: make these into a library..."
"(no comments yet, but can put strings in a block)"

each:{ary reduce init;
  Array.isArray(ary) ? nil ; crash("not an array")
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
  eachR:{ary; each(ary {acc e; R(e)} nil)}
  R:{node;
    eq(node.type $block) ? eachR(node.body) ; 
    eq(node.type $fun) ? nil ;
    eq(node.type $def) ? {;
      vars = concat(eq(vars "") ?  ["var " compile(node.left)] ; [vars ", " compile(node.left)])
      R(node.right)
    }() ;
    eq(node.type $set) ? R(node.right) ;
    eq(node.type $if) ? {; R(node.left) R(node.mid) R(node.right) }() ;
    {;eq(node.type $and)|eq(node.type $or)}() ? {; R(node.left) R(node.right) }() ;
    eq(node.type $call) ? {; R(node.value) eachR(node.args) }() ;
    eq(node.type $array) ? eachR(node.value) ;
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
  type:node.type
  concat(
    eq(type $boolean) ? [stringify(node.value)] ;
    eq(type $number)  ? [stringify(node.value)] ;  
    eq(type $string)  ? [stringify(node.value)] ;  
    eq(type $variable)? [stringify(node.value)] ;  
    eq(type $symbol)  ? ["$(\"" stringify(node.value) "\")"] ;
    eq(type $nil)     ? ["null"] ;
    eq(type $is)      ? ["true"] ;
    {; eq(type $def) | eq(type $set) }()
                      ? ["(" stringify(node.left.value) " = "
                          eq(node.right.type $fun) ? compile_fun(node.right node.left) ;
                          eq(node.right.type $object) ? concat([object_each(node.right.value {s k v;
                            concat([s
                              ", "  stringify(node.left.value)
                              "."   stringify(k)
                              "=" compile(v)
                            ])} "{}") ", " stringify(node.left.value)]) ;
                          compile(node.right)
                          ")"] ;
    eq(type $if)      ? ["(" compile(node.left)  " ? "
                                     compile(node.mid)   " : "
                                     compile(node.right)  ")"] ;
    eq(type $and)     ? ["(" compile(node.left)  " ? "  
                                     compile(node.right) " : false )"] ;
    eq(type $or)      ? ["(" compile(node.left) " ? true : "
                                     compile(node.right) ")"] ;
    eq(type $access)  ? ["(" compile(node.left)
                             concat(node.static ? ["." compile(node.mid)] ; ["[" compile(node.mid) "]"])
                             eq(node.right nil) ? "" ; concat(["=" compile(node.right)]) ")"] ;
    eq(type $call)    ? [ eq(node.value.type $fun) ? concat(["(" compile(node.value) ")"]) ; compile(node.value) "(" args(node.args) ")"] ;
    eq(type $fun)     ? [ compile_fun(node nil) ] ;
    eq(type $array)   ? ["[" args(node.value) "]"] ;
    eq(type $block)   ? ["(" args(node.body) ")"] ;
    eq(type $object)  ? ["{"
      object_each(node.value {s k v; concat([s {; eq(s "") ? "" ; ", " }() stringify(k) ": " compile(v)])} "")
                         "}"] ;
    [ JSON.stringify(node)]
  )
}