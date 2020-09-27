each:{ary reduce init;
  R: {acc i; lt(i ary.length) ? R(reduce(acc ary.[i]) add(1 i)) ; acc}
  R(init 0)}

each_iv:{ary fn;
  R: {i v; lt(i ary.length) ? R(add(1 i) fn(ary.[i] i)) ; ary }
  R(0 nil)
}

join:{a str; each(a {acc item; eq(acc "") ? item ; concat([acc str item])} "")}

map:{ary map;
  len: ary.length _ary: createArray(len)
  R: {i v; lt(i len) ? R(add(1 i) _ary.[i] = map(ary.[i])) ; _ary}
  R(0 nil)
}

map_i:{ary map;
  len: ary.length _ary: createArray(len)

  R: {i; lt(i len) ? {; _ary.[i] = map(ary.[i] i) R(add(1 i))}() ; _ary}
  R(0)
}

concat:{ary; eq(ary.length 0) ? ary.[0] ; each(ary {a b; cat(a b)} "")}


concat_ary: {a b;
  eq(a nil) ? b ; eq(b nil) ? a ; {;
    c: createArray(add(a.length b.length))
    each_iv(a {v i; c.[i] = v c})
    each_iv(b {v i; c.[add(a.length i)] = v c})
    c
  }() 
}

zip:{ary1 ary2 fun; map_i(ary1 {v i; fun(v ary2.[i])})}

{each:each each_iv: each_iv join: join map: map map_i:map_i concat:concat zip:zip concat_ary: concat_ary}
