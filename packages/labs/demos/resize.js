import {ResizeController as e} from '../controllers/resize.js';
import {LitElement as t, html as r} from 'lit-element';
import {customElement as o} from 'lit-element/decorators.js';
let i = class extends t {
  constructor() {
    super(...arguments), (this.h = new e(this));
  }
  render() {
    return r`      
      <textarea ${this.h.observe()}>Resize Me</textarea>
      <pre>
        Width: ${this.h.contentRect?.width}
        Height: ${this.h.contentRect?.height}
      </pre>
    `;
  }
};
i = (function (e, t, r, o) {
  var i,
    s = arguments.length,
    l =
      s < 3 ? t : null === o ? (o = Object.getOwnPropertyDescriptor(t, r)) : o;
  if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate)
    l = Reflect.decorate(e, t, r, o);
  else
    for (var n = e.length - 1; n >= 0; n--)
      (i = e[n]) && (l = (s < 3 ? i(l) : s > 3 ? i(t, r, l) : i(t, r)) || l);
  return s > 3 && l && Object.defineProperty(t, r, l), l;
})([o('resize-controller-demo')], i);
export {i as ResizeControllerDemoElement};
//# sourceMappingURL=resize.js.map
