HT: import("./hashtable.js")
a:  import("./arrays")
each: a.each map: a.map
n:  import("./nodes")

transform: import("./transform").transform

{counter;
  counter@i32
  unique: {scope name; scope.set(name {
    type: $variable
    value: create_symbol(cat(stringify(name) cat("_" stringify(counter = add(1 counter)))))
  })}
  get: {scope name; neq(nil v:scope.get(name.value)) ? v ; name }

  {node;
    transform(node HT(nil) {node scope R;
      c:{x; eq(node.type x)}
      c($def)       ? n.Def(unique(scope node.left.value) R(node.right scope)) ;
      c($set)       ? n.Set(get(scope node.left) R(node.right scope)) ;
      c($variable)  ? get(scope node);
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