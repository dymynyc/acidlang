n: import("./nodes")
EQ: {x; {y; eq(x y) }}
a: import("./arrays")
map: a.map each_iv: a.each_iv concat_ary:a.concat_ary

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
//if returns true, then stops traversing
_each: {ary fn; each(ary {s v; fn(v) } nil)}

traverse: {node data fn;
  T:{node data;
    c:EQ(node.type)
    R: {node; T(node data)}
    eq(true fn(node data T)) ? nil ;
    
    c($set)      ? {; R(node.left) R(node.right) }();
    c($def)      ? {; R(node.left) R(node.right) }();
    c($block)    ? _each(node.body R) ;
    c($array)    ? _each(node.value R) ;
    c($object)   ? object_each(node.value {_ k v; R(v)} nil) ;
    c($call)     ? {; R(node.value) _each(node.args R) }() ;
    c($access)   ? {; R(node.left) R(node.mid) neq(nil node.right) & R(node.right)}();
    c($if)       ? {; R(node.left) R(node.mid) R(node.right) }() ;
    c($and)      ? {; R(node.left) R(node.right) }() ;
    c($or)       ? {; R(node.left) R(node.right) }() ;
    c($is)       ? {; R(node.left) R(node.right) }() ;
    c($fun)      ? {; _each(node.args R) R(node.body) }();
    c($var)      ? nil ;
    c($symbol)   ? nil ;
    c($number)   ? nil ;
    c($string)   ? nil ;
    c($boolean)  ? nil ;
    c($nil)      ? nil ;
                   crash("unknown node")
  }
  T(node data)
}

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



transform: {node data fn;
    c:EQ(node.type)
    T:{node; transform(node data fn)}
    eq(node nil)? nil;
    neq(nil v:fn(node data {node data; transform(node data fn)}))
                ? v ;
    c($def)     ? n.Def(node.left T(node.right)) ;
    c($set)     ? n.Set(node.left T(node.right)) ;
    c($var)     ? n.Var(node.value);
    c($fun)     ? n.Fun(map(node.args T) T(node.body));    
    c($access)  ? n.Access(T(node.left) T(node.mid) neq(nil node.right) ? T(node.right) ; nil node.static);
    c($call)    ? n.Call(T(node.value) map(node.args T)) ;
    c($block)   ? n.Block(map(node.body T)) ;
    c($if)      ? n.If(T(node.left) T(node.mid) T(node.right)) ;  
    c($and)     ? n.And(T(node.left) T(node.right)) ;  
    c($or)      ? n.Or(T(node.left) T(node.right)) ;  
    c($is)      ? n.Is(T(node.left) T(node.right)) ;
    c($array)   ? n.Array(map(node.value T)) ;
    c($object)  ? n.Object(create_object(object_each(node.value
                  {ary k v; 
                    //not efficient because it creates a new array
                    //better would be a list + create object from the list. when this is compiled to wasm, it will
                    //likely use some pattern like the array though.
                    concat_ary(ary [{key: k value: T(v)}])
                  } nil))) ;
    c($number)  ? n.Number(node.value) ;
    c($boolean) ? n.Boolean(node.value) ;
    c($nil)     ? n.Nil() ;
    c($string)  ? n.String(node.value) ;
    c($symbol)  ? n.Symbol(node.value) ;
                  crash("unknown node")
}

{
  copy: {node; transform(node nil {;})}
  transform: transform
  traverse: traverse
  find: find
}