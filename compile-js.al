a: import("./arrays")
each: a.each map: a.map map_i: a.map_i join: a.join concat: a.concat

get_vars:{node;
  acc: ""
  eachR:{ary; each(ary {acc e; R(e)} nil)}
  R:{node;
    c:{v; eq(node.type v) }

    c($block)           ? eachR(node.body) ; 
    c($def)             ? {;
                            s: stringify(node.left.value)
                            acc = concat(eq(acc "") ?  ["var " s] ; [acc ", " s])
                            R(node.right)
                          }() ;
    c($set)             ? R(node.right) ;
    c($if)              ? {; R(node.left) R(node.mid) R(node.right) }() ;
    {;c($and)|c($or)}() ? {; R(node.left) R(node.right) }() ;
    c($call)            ? {; R(node.value) eachR(node.args) }() ;
    c($array)           ? eachR(node.value) ;
                          nil
  }
  
  R(node)
  eq(acc "") ? "" ; concat([acc "; "])
}

isCall: {node name;
  neq(nil name) & eq(node.type $call) & eq(node.value.type $variable) & eq(node.value.value name.value)
}

compile:{node insert;
  args:{ary;
    join(map(ary C) ", ")
  }
  
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
    c:{v; eq(type v)}
    concat(
      c($boolean) ? [stringify(node.value)] ;
      c($number)  ? [stringify(node.value)] ;  
      c($string)  ? [stringify(node.value)] ;  
      c($variable)? [stringify(node.value)] ;  
      c($symbol)  ? ["$(" stringify(stringify(node.value)) ")"] ;
      c($nil)     ? ["null"] ;
      c($is)      ? ["true"] ;
      {; c($def) | c($set)}()
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
      c($if)      ? ["(" C(node.left) " ? " C(node.mid) " : " C(node.right)  ")"] ;
      c($and)     ? ["(" C(node.left) " ? " C(node.right) " : false )"] ;
      c($or)      ? ["(" C(node.left) " ? true : " C(node.right) ")"] ;
      c($access)  ? ["(" C(node.left)
                       concat(node.static ? ["." C(node.mid)] ; ["[" C(node.mid) "]"])
                       eq(node.right nil) ? "" ; concat(["=" C(node.right)])
                    ")" ] ;
      c($call)    ? [
                      {;  eq(node.value.type $variable) & neq(insert(node.value.value nil) nil) }()
                      ? insert(node.value.value map(node.args C)) ;
                      concat([
                        eq(node.value.type $fun) ? concat(["(" C(node.value) ")"]) ; C(node.value)
                        "(" args(node.args) ")"
                      ])
                    ] ;
      c($fun)     ? [ compile_fun(node nil) ] ;
      c($array)   ? ["[" args(node.value) "]"] ;
      c($block)   ? ["(" join(map(node.body C) ",\n") ")"] ;
      c($object)  ? ["{"
                      object_each(node.value {s k v;
                        concat([s {; eq(s "") ? "" ; ", " }() stringify(k) ": " C(v)])
                      } "")
                    "}"] ;
                    [ crash(node) ]
    )}
    C(node)
}

{root insert;
  concat(["(function () {\n" get_vars(root) "\n return " compile(root insert) "\n}())"])
}