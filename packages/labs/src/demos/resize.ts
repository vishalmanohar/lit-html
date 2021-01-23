import {LitElement, html} from 'lit-element';
import {customElement} from 'lit-element/decorators.js';
import {ResizeController} from '../controllers/resize.js';

@customElement('resize-controller-demo')
export class ResizeControllerDemoElement extends LitElement {
  _resize = new ResizeController(this);

  render() {
    return html`
      <textarea ${this._resize.observe()}>Resize Me</textarea>
      <pre>
        Width: ${this._resize.contentRect?.width}
        Height: ${this._resize.contentRect?.height}
      </pre
      >
    `;
  }
}
