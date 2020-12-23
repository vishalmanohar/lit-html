import {nothing as t, NodePart as o} from './lit-html.js';
const n = (o) => {
    const n = document.createDocumentFragment(),
      r = {_value: o._value, st: n};
    let e,
      l = o.D.nextSibling;
    for (; l !== o.E; ) (e = l.nextSibling), n.append(l), (l = e);
    return (o._value = t), r;
  },
  r = (t, o) => {
    t.k(o.st), (t._value = o._value);
  },
  e = () => document.createComment(''),
  l = (t, n) => {
    const r = t.D.parentNode,
      l = void 0 === n ? t.E : n.D,
      s = r.insertBefore(e(), l),
      u = r.insertBefore(e(), l);
    return new o(s, u, t.options);
  },
  s = (t, o, n) => {
    if (void 0 !== t.strings) {
      if (void 0 === n)
        throw Error(
          "An index must be provided to set an AttributePart's value."
        );
      const r = [...t._value];
      (r[n] = o), t._setValue(r, 0);
    } else t._setValue(o);
    return t;
  },
  u = (t) => t._value,
  i = (t, o, n) => {
    const r = t.D.parentNode,
      e = n ? n.D : t.E,
      l = o.E.nextSibling;
    l !== e && d(r, o.D, l, e);
  },
  c = (t) => {
    f(t.D, t.E.nextSibling);
  },
  d = (t, o, n = null, r = null) => {
    for (; o !== n; ) {
      const n = o.nextSibling;
      t.insertBefore(o, r), (o = n);
    }
  },
  f = (t, o = null) => {
    for (; t !== o; ) {
      const o = t.nextSibling;
      t.remove(), (t = o);
    }
  };
export {
  l as createAndInsertPart,
  n as detachNodePart,
  u as getPartValue,
  i as insertPartBefore,
  c as removePart,
  r as restoreNodePart,
  s as setPartValue,
};
//# sourceMappingURL=parts.js.map
