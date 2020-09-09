HT: import("./hashtable.js")
a:  import("./arrays")
each: a.each map: a.map

unique: {name number; {
  type: $variable
  value: createSymbol(cat(stringify(name) cat("_" stringify(number))))
}} 

counter: 0
inc: {; counter = add(1 counter) }

uniquify: {node;
  scope: HT(nil)
  US: {node scope;
    U: {node; US(node scope)}
    eq(node.type $def) ?
      {;
        s: unique(node.left.value inc())
        node.left = scope.set(node.left.value s)
        U(node.right)
      }() ;
    eq(node.type $set) ?
      {;
        node.left = scope.get(node.left)
        U(node.right)
      }() ;
    eq(node.type $variable) ? {;
      scope.has(node.value) ? {; node.value = scope.get(node.value).value }() ; node.value
    }();
    eq(node.type $fun) ?
      {;
        _scope: HT(scope)
        node.args = map(node.args {v; _scope.set(v.value unique(v.value inc())) })
        "TODO: function name..."
        US(node.body _scope)
      }() ;
    eq(node.type $access) ?
      {;
        U(node.left)
        neq(true node.static) & U(node.mid)
        neq(nil node.right) & U(node.right)
      }() ;  
    eq(node.type $call)    ? {; U(node.value) map(node.args U) }() ;
    eq(node.type $block)   ? map(node.body U) ;
    eq(node.type $if)      ? {; U(node.left) U(node.mid) U(node.right) }() ;  
    eq(node.type $and)     ? {; U(node.left) U(node.right) }() ;  
    eq(node.type $or)      ? {; U(node.left) U(node.right) }() ;  
    eq(node.type $is)      ? {; U(node.left) U(node.right) }() ;
    eq(node.type $array)   ? map(node.value U) ;
    eq(node.type $object)  ? object_each(node.value {_ k v; 
      "shouldn't actually need to explicitly mutate it here. not sure what's happening"
      "something must be being copied but I'm not sure where"
      node.value.[k] = U(v)
    }) ;
    eq(node.type $number)  ? nil ;
    eq(node.type $boolean) ? nil ;
    eq(node.type $nil)     ? nil ;
    eq(node.type $string)  ? nil ;
    eq(node.type $symbol)  ? nil ;
    
    {; print(["unjnown" node]) crash("unknown node") }()

    node
  }
  US(node scope)
  node
}