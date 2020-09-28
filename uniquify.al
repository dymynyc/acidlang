HT: import("./hashtable.js")
a:  import("./arrays")
each: a.each map: a.map
n:  import("./nodes")

transform: import("./ast").transform

{counter;
  counter@i32
  
  unique: {scope name;
    s: stringify(name)
    i: index_of(s "_")

    scope.set(name {
      type: $var
      value: create_symbol(cat(
        neq(-1 i) ? substring(s 0 i) ; s cat("_" stringify(counter = add(1 counter)))))
    })
  }
  get: {scope name;
    neq(nil v:scope.get(name.value)) ? v ; name }

  {node;
    transform(node HT(nil) {node scope R;
      c:{x; eq(node.type x)}
      T:{x; eq(x nil) ? nil ; R(x scope)}
      c($def)       ? n.Def(unique(scope node.left.value) R(node.right scope)) ;
      c($set)       ? n.Set(get(scope node.left) R(node.right scope)) ;
      c($var)  ? get(scope node);
      c($access) ? node.static ? n.Access(T(node.left) node.mid T(node.right) true) ; nil ; //node.static ? n.Access(R(node.left) node.mid R(node.right) true); nil ;
      c($fun)       ? {;
                        _scope: HT(scope)
                        n.Fun(
                          map(node.args {v; unique(_scope v.value) })
                          R(node.body _scope)
                        )
                      }() ;
                      nil //fallback to default copying the node
    })
  }
}