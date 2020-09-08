"TODO: needs object support, then should be able to compile itself"

"todo: make these into a library..."
"(no comments yet, but can put strings in a block)"
a: import("./arrays")
each: a.each map: a.map map_i: a.map_i join: a.join concat: a.concat

get_vars:{node;
  acc: ""
  eachR:{ary; each(ary {acc e; R(e)} nil)}
  R:{node;
    eq(node.type $block) ? eachR(node.body) ; 
    eq(node.type $fun) ? nil ;
    eq(node.type $def) ? {;
      s: stringify(node.left.value)
      acc = concat(eq(acc "") ?  ["var " s] ; [acc ", " s])
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
  eq(acc "") ? "" ; concat([acc "; "])
}

isCall: {node name;
  neq(nil name) & eq(node.type $call) & eq(node.value.type $variable) & eq(node.value.value name.value)
}

compile:{node insert;
  args:{ary; join(map(ary C) ", ") }
  
  compile_recursive: {fn name;
    c_r: {test not fn update result;
      concat([
        "(" args(fn.args) ") => {"
        "\"TODO: this _t vars need to be globally unique\";\n"
        "var " join(map_i(fn.args {v i; concat(["_t" stringify(i)])}) ", ") ";\n"
        "while(" not ? "!" ; "" C(fn.body.left) ") {\n"
        concat(map_i(update.args {v i; concat(["_t" stringify(i) " = " C(v) "; "]) }))
        concat(map_i(update.args {v i; concat([C(fn.args.[i]) " = _t" stringify(i) "; "]) }))
        "} return " C(result) "\n}"
      ])
    }
    neq(fn.body.type $if) ? nil ;
    isCall(fn.body.mid name)   ? c_r(fn.body.left false fn fn.body.mid   fn.body.right) ;
    isCall(fn.body.right name) ? c_r(fn.body.left true  fn fn.body.right fn.body.mid) ;
    nil
  }

  compile_fun: {node name; 
    vars: get_vars(node.body)
    s: compile_recursive(node name)
    neq(s nil) ? s ;
    concat(
      eq(name nil)
      ? ["(" args(node.args) ") => "
          concat(eq(vars "")
          ? ["(" C(node.body) ")"]
          ; ["{" vars "return " C(node.body) "}"])
        ]
      ; ["(function " C(name) " (" args(node.args) ") {"
          vars "return " C(node.body) "})"]
    )
  }
  C: {node;
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
                                "=" C(v)
                              ])} "{}") ", " stringify(node.left.value)]) ;
                            C(node.right)
                            ")"] ;
      eq(type $if)      ? ["(" C(node.left) " ? " C(node.mid) " : " C(node.right)  ")"] ;
      eq(type $and)     ? ["(" C(node.left) " ? " C(node.right) " : false )"] ;
      eq(type $or)      ? ["(" C(node.left) " ? true : " C(node.right) ")"] ;
      eq(type $access)  ? ["(" C(node.left)
                               concat(node.static ? ["." C(node.mid)] ; ["[" C(node.mid) "]"])
                               eq(node.right nil) ? "" ; concat(["=" C(node.right)])
                          ")" ] ;
      eq(type $call)    ? [
          {; eq(node.value.type $variable) & neq(insert(node.value.value nil) nil) }()
                                   ? insert(node.value.value map(node.args C));
          concat([eq(node.value.type $fun) ? concat(["(" C(node.value) ")"]) ; C(node.value)
            "(" args(node.args) ")"
          ])] ;
      eq(type $fun)     ? [ compile_fun(node nil) ] ;
      eq(type $array)   ? ["[" args(node.value) "]"] ;
      eq(type $block)   ? ["(" join(map(node.body C) ",\n") ")"] ;
      eq(type $object)  ? ["{"
        object_each(node.value {s k v; concat([s {; eq(s "") ? "" ; ", " }() stringify(k) ": " C(v)])} "")
                           "}"] ;
      [ crash(node) ]
    )}
    C(node)
}