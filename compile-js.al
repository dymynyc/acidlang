args:{ary; join(map(ary compile) ", ")}
"todo: make these into a library..."
each:{ary reduce init;
  R: {acc i; gt(ary.length i) ? R(reduce(acc ary.[i]) add(1 i)) ; acc}
  R(init 0)}
join:{a str; each(a {acc item; eq(acc "") ? item ; concat([acc str item])} "")}
map:{ary map;
  len: ary.length
  _ary: Array(len)
  R: {i; gt(len i) ? {; _ary.[i] = map(ary.[i]) R(add(1 i))}() ; _ary}
  R(0)}
concat:{ary; each(ary {acc item; cat(acc item)} "")}

compile:{node;
  print(node)
  type:node.type
  
  eq(type $boolean)  ? stringify(node.value) ;
  eq(type $number)   ? stringify(node.value) ;  
  eq(type $variable) ? stringify(node.value) ;  
  eq(type $nil)      ? "null" ;
  eq(type $is)       ? "true" ;
  concat(
    eq(type $def) | eq(type $set)
                      ? [stringify(node.left.value) " = " compile(node.right)] ;
      
    eq(type $symbol)  ? ["$(" stringify(node.left.value) ")"] ;
      
      
    eq(type $if)      ? ["(" compile(node.left)  " ? "
                                     compile(node.mid)   " : "
                                     compile(node.right)  ")"] ;
    eq(type $and)     ? ["(" compile(node.left)  " ? "  
                                     compile(node.right) " : false )"] ;
    eq(type $or)      ? ["(" compile(node.left) " ? true ; "
                                     compile(node.right) ")"] ;
    eq(type $access)  ? ["(" compile(node.left)  "." compile(node.mid)
                           node.right ? concat(["=" compile(node.right)]) ; ""
                           ")"] ;
    eq(type $call)    ? [ compile(node.value) "(" args(node.args) ")"] ;
    eq(type $fun)     ?
                        ["(" args(node.args) ") => (" args(node.body) ")"] ;
    eq(type $array)   ? ["[" args(node.value) "]"] ;
    eq(type $object)  ? ["{" join(map(node.value
                            {kv; concat([ compile(kv.key) ":" compile(kv.value)])})
                            ", ") "}"] ;
    ["(function () { throw new Error('unknown node') }())"])}