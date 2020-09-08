each:{ary reduce init;
  R: {acc i; lt(i ary.length) ? R(reduce(acc ary.[i]) add(1 i)) ; acc}
  R(init 0)}

join:{a str; each(a {acc item; eq(acc "") ? item ; concat([acc str item])} "")}

map:{ary map;
  len: ary.length _ary: createArray(len)

  R: {i; lt(i len) ? {; _ary.[i] = map(ary.[i]) R(add(1 i))}() ; _ary}
  R(0)
}

map_i:{ary map;
  len: ary.length _ary: createArray(len)

  R: {i; lt(i len) ? {; _ary.[i] = map(ary.[i] i) R(add(1 i))}() ; _ary}
  R(0)
}

concat:{ary; eq(ary.length 0) ? ary.[0] ; each(ary {a b; cat(a b)} "")}

{each:each join: join map: map map_i:map_i concat:concat}