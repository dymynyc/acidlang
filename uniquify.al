HT: import("./hashtable.js")
a:  import("./arrays")
each: a.each map: a.map

{counter;
  counter@i32

  unique: {scope name; scope.set(name {
    type: $variable
    value: createSymbol(cat(stringify(name) cat("_" stringify(counter = add(1 counter)))))
  })} 

  {node;
    scope: HT(nil)
    US: {node scope;
      U: {node; US(node scope)}
      "sneaky way to make switch statement"
      c:{v; eq(node.type v)}
      
      c($def)     ? {;
                      node.left = unique(scope node.left.value)
                      U(node.right)
                    }() ;
      c($set)     ? {;
                      node.left = scope.get(node.left)
                      U(node.right)
                    }() ;
      c($variable)? scope.has(node.value) & node.value = scope.get(node.value).value ;
      c($fun)     ? {;
                      _scope: HT(scope)
                      node.args = map(node.args {v; unique(_scope v.value) })
                      "TODO: function name...?"
                      US(node.body _scope)
                    }() ;
      c($access)  ? {;
                      U(node.left)
                      neq(true node.static) & U(node.mid)
                      neq(nil node.right) & U(node.right)
                    }() ;  
      c($call)    ? {; U(node.value) map(node.args U) }() ;
      c($block)   ? map(node.body U) ;
      c($if)      ? {; U(node.left) U(node.mid) U(node.right) }() ;  
      c($and)     ? {; U(node.left) U(node.right) }() ;  
      c($or)      ? {; U(node.left) U(node.right) }() ;  
      c($is)      ? {; U(node.left) U(node.right) }() ;
      c($array)   ? map(node.value U) ;
      c($object)  ? object_each(node.value {_ k v; 
                      "shouldn't actually need to explicitly mutate it here."
                      "something must be being copied but I'm not sure where"
                      node.value.[k] = U(v)
                    }) ;
      c($number)  ? nil ;
      c($boolean) ? nil ;
      c($nil)     ? nil ;
      c($string)  ? nil ;
      c($symbol)  ? nil ;
                    crash("unknown node")

      node
    }
    US(node scope)
    node
  }
}