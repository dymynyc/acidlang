n: import("./nodes")
EQ: {x; {y; eq(x y) }}
a: import("./arrays")
map: a.map each_iv: a.each_iv concat_ary:a.concat_ary

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
}