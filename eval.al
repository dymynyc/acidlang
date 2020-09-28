a: import("./arrays")
HT: import("./hashtable.js")

call: {fn args;
  is_function(fn)
  ? call_function(fn args)
  ; {;
    scope: HT(fn.scope)
    a.each_iv(fn.args {k i; scope.set(k.value args.[i])})
    ev(fn.body scope)
  }()
}

is: {l r;
  eq($object r.type) ? object_each(r.value {_ k v; is(l.value.[k] v)} nil) ;
  eq(l.type r.value) ? True ;
                       crash("incorrect types")
}

Fun: {args body scope;  {type: $fun args: args body: body scope: scope name: nil}}

True:  {type:$boolean value:true}
False: {type:$boolean value:false}

ev: {node scope;
  e:{node; ev(node scope)}
  c:{x; eq(x node.type)}
  c($string)  ? {type:$string  value:node.value} ;
  c($number)  ? {type:$number  value:node.value} ;
  c($symbol)  ? {type:$symbol  value:node.value} ;
  c($boolean) ? {type:$boolean value:node.value} ;
  c($nil)     ? {type:$nil     value:nil} ;
  c($if)      ? eq(true e(node.left).value) ? e(node.mid) ; e(node.right) ;
  c($and)     ? eq(true e(node.left).value) ? e(node.right) ; False ;
  c($or)      ? eq(true e(node.left).value) ? True ; e(node.right) ;
  c($var)     ? print(scope.get(node.value)) ;
  c($def)     ? neq($object node.right.type)
                ? scope.set(node.left.value e(node.right))
                ; {;
                    scope.set(node.left.value obj1: {type:$object value:nil cyclic: true})
                    scope.set(node.left.value obj2: e(node.right))
                    obj1.value = obj2.value
                    obj2
                  }() ;
  c($set)     ? scope.get(node.left.value).value =  e(node.right) ;
  c($fun)     ? Fun(node.args node.body scope) ;
  c($call)    ? call(e(node.value) a.map(node.args e)) ;
  c($array)   ? {type:$array value :a.map(node.value e)} ;
  c($object)  ? {type: $object value: create_object(a.map(object_keys(node.value) {key;
                  {key:key value: e(node.value.[key])}
                }))};
  c($access)  ? {;
                l: e(node.left) m: e(node.mid)
                {; eq($array l.type) & eq(m.type $symbol) & eq(m.value $length) }()
                ? l.value.length
                ; {;
                    eq(nil node.right)
                    ? l.value.[m.value]
                    ; l.value.[m.value] = e(node.right)
                  }()
                }() ;
  c($is)      ? is(e(node.left) e(node.right)) ;
  c($block)   ? a.each(node.body {r v_; e(v_)} nil) ;
                crash("unkown ast node")
}